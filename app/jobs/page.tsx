'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase'; 
import { 
  sortJobs, 
  paginateJobs, 
  getAvailableTags, 
  getAvailableLocations, 
  getSalaryStats, 
  syncJobsToFirebase,
  Job
} from '@/lib/jobUtils';
import { 
  extractSalaryInfo, 
  formatSalaryDisplay, 
  generateSalaryBreakdown,
  extractFromDescription,
  SalaryInfo
} from '@/lib/salaryExtractor';
import { 
  Zap, Search, MapPin, DollarSign, Briefcase, ArrowRight, 
  ExternalLink, Clock, TrendingUp, Globe, RefreshCw, X, Languages, Loader2,
  Sparkles, AlertCircle
} from 'lucide-react';
import Nav from '@/components/Nav';

const WORK_LOCATION_ICONS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  digital: { label: 'Remote', icon: '💻', color: 'text-blue-400' },
  onsite: { label: 'On-site', icon: '🏢', color: 'text-green-400' },
  hybrid: { label: 'Hybrid', icon: '🔄', color: 'text-purple-400' },
};

// ✅ Translation cache to avoid repeated API calls
const translationCache = new Map<string, { translated: string; detectedLanguage: string; wasTranslated: boolean }>();

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedWorkLocations, setSelectedWorkLocations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'salary-high' | 'salary-low' | 'company'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [salaryStats, setSalaryStats] = useState<any>(null);
  const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);
  const [selectedJobSalaryBreakdown, setSelectedJobSalaryBreakdown] = useState<any>(null);
  const [selectedJobWageBreakdown, setSelectedJobWageBreakdown] = useState<any>(null);
  const [extractedSalaryInfo, setExtractedSalaryInfo] = useState<SalaryInfo | null>(null);

  // ✅ Translation state
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [wasTranslated, setWasTranslated] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // 1. REAL-TIME LISTENER EFFECT
  useEffect(() => {
    if (!db) {
        setError("Database connection unavailable.");
        setLoading(false);
        return;
    }

    setLoading(true);
    const jobsRef = ref(db, 'jobs');

    const unsubscribe = onValue(jobsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const normalizedJobs = Object.keys(data).map((key) => {
            const jobData = data[key];
            
            // ✅ Extract salary from description if not present
            let salaryInfo = jobData.salary;
            if (!salaryInfo && jobData.description) {
              salaryInfo = extractFromDescription(jobData.description);
            }
            
            return {
              id: key,
              ...jobData,
              workLocation: jobData.workLocation || 'digital',
              tags: Array.isArray(jobData.tags) ? jobData.tags : [], 
              title: jobData.title || 'Unknown Position',
              company: jobData.company || 'Unknown Company',
              description: jobData.description || '',
              location: jobData.location || 'Remote',
              jobType: jobData.jobType || 'Full-time',
              salary: salaryInfo, // Add extracted salary
            };
          });

          setJobs(normalizedJobs);
          
          const tags = getAvailableTags(normalizedJobs);
          const locations = getAvailableLocations(normalizedJobs);
          const salary = getSalaryStats(normalizedJobs);

          setAvailableTags(tags.slice(0, 15));
          setAvailableLocations(locations);
          setSalaryStats(salary);
          setError(null);
        } else {
          setJobs([]);
          setFilteredJobs([]);
        }
      } catch (err) {
        console.error('Error processing job data:', err);
        setError('Failed to process job data.');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to jobs:", error);
      setError("Connection error. Please check your internet.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FILTERING EFFECT
  useEffect(() => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((job) =>
        selectedTags.some((tag) =>
          job.tags?.some((jobTag) => jobTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        job.location?.toLowerCase() === 'remote'
      );
    }

    if (selectedWorkLocations.length > 0) {
      filtered = filtered.filter((job) =>
        selectedWorkLocations.includes(job.workLocation)
      );
    }

    filtered = sortJobs(filtered, sortBy);
    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedTags, selectedLocation, selectedWorkLocations, sortBy, jobs]);

  const pageSize = 10;
  const { jobs: paginatedJobs, totalPages } = paginateJobs(filteredJobs, currentPage, pageSize);

  // ✅ Translation function
  const translateText = useCallback(async (text: string, jobId: string) => {
    const cacheKey = `${jobId}_${text.substring(0, 100)}`;
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey)!;
      setTranslatedDescription(cached.translated);
      setDetectedLanguage(cached.detectedLanguage);
      setWasTranslated(cached.wasTranslated);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: 'English' }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      
      setTranslatedDescription(data.translated);
      setDetectedLanguage(data.detectedLanguage);
      setWasTranslated(data.wasTranslated);

      translationCache.set(cacheKey, {
        translated: data.translated,
        detectedLanguage: data.detectedLanguage,
        wasTranslated: data.wasTranslated,
      });
    } catch (err) {
      console.error('Translation error:', err);
      setTranslationError('Unable to translate. Showing original text.');
      setTranslatedDescription(text);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Handlers
  const handleSyncJobs = async () => {
    setIsSyncing(true);
    try {
      const count = await syncJobsToFirebase();
      alert(`Successfully synced ${count} jobs from Remote OK and Arbeitnow!`);
    } catch (err) {
      console.error(err);
      alert('Failed to sync jobs. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleWorkLocation = (workLocation: string) => {
    setSelectedWorkLocations((prev) => prev.includes(workLocation) ? prev.filter((wl) => wl !== workLocation) : [...prev, workLocation]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // ✅ Updated formatSalary to handle new SalaryInfo structure
  const formatSalary = (salary: SalaryInfo) => {
    if (!salary) return 'Not specified';
    return formatSalaryDisplay(salary);
  };

  const formatWages = (wages: any) => {
    if (!wages) return 'Not specified';
    return `${wages.currency}${wages.hourlyMin} - ${wages.currency}${wages.hourlyMax}/hr`;
  };

  // ✅ Updated getCompensationDisplay with confidence tracking
  const getCompensationDisplay = (job: Job) => {
    if (job.salary) {
      const salaryInfo = job.salary as SalaryInfo;
      return { 
        label: 'Salary', 
        value: formatSalary(salaryInfo),
        confidence: salaryInfo.confidence || 'high',
        source: salaryInfo.source || 'structured'
      };
    }
    if (job.wages) return { 
      label: 'Hourly Rate', 
      value: formatWages(job.wages),
      confidence: 'high',
      source: 'structured'
    };
    return { 
      label: 'Compensation', 
      value: 'Not specified',
      confidence: null,
      source: null
    };
  };

  const getWorkLocationDisplay = (workLocation: string) => {
    return WORK_LOCATION_ICONS[workLocation] || WORK_LOCATION_ICONS.digital;
  };

  const getSourceBadge = (id: string) => {
    if (id.startsWith('rok_')) return { label: 'RemoteOK', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    if (id.startsWith('arb_')) return { label: 'Arbeitnow', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    return { label: 'Direct', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  };

  // ✅ Get confidence badge color
  const getConfidenceBadge = (confidence: string | null, source: string | null) => {
    if (!confidence) return null;
    
    if (confidence === 'high') {
      return {
        color: 'text-green-400 bg-green-400/10 border-green-400/30',
        icon: <Sparkles size={12} />,
        text: 'Verified'
      };
    }
    if (confidence === 'medium') {
      return {
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
        icon: <AlertCircle size={12} />,
        text: 'Extracted'
      };
    }
    return {
      color: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
      icon: <AlertCircle size={12} />,
      text: 'Estimated'
    };
  };

  const handleJobClick = (job: Job) => {
    setSelectedJobModal(job);
    
    // Reset translation state
    setTranslatedDescription(null);
    setDetectedLanguage('');
    setWasTranslated(false);
    setTranslationError(null);
    setExtractedSalaryInfo(null);
    
    // ✅ Handle salary breakdown with new structure
    if (job.salary) {
      const salaryInfo = job.salary as SalaryInfo;
      const breakdown = generateSalaryBreakdown(salaryInfo);
      setSelectedJobSalaryBreakdown(breakdown);
      setExtractedSalaryInfo(salaryInfo);
    } else {
      setSelectedJobSalaryBreakdown(null);
    }

    // ✅ FIXED: Removed duplicate 'hourly' key
    if (job.wages && job.wages.hourlyMin && job.wages.hourlyMax) {
      const annualEquivalent = { min: job.wages.hourlyMin * 40 * 52, max: job.wages.hourlyMax * 40 * 52 };
      const breakdown = generateSalaryBreakdown({
        min: annualEquivalent.min, 
        max: annualEquivalent.max, 
        currency: job.wages.currency,
        salaryType: 'hourly', 
        rawText: formatWages(job.wages),
        confidence: 'high',
        source: 'structured'
      });
      
      // Just use the breakdown directly, it already contains the correct hourly values
      setSelectedJobWageBreakdown(breakdown);
    } else {
      setSelectedJobWageBreakdown(null);
    }
  };

  const handleTranslate = () => {
    if (!selectedJobModal) return;
    translateText(selectedJobModal.description, selectedJobModal.id);
  };

  const handleShowOriginal = () => {
    setTranslatedDescription(null);
    setDetectedLanguage('');
    setWasTranslated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-28 px-4 flex items-center justify-center">
        <div className="animate-spin"><Zap size={32} className="text-yellow-300" /></div>
        <span className="ml-4 text-xl font-semibold">Loading jobs...</span>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white pt-28 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.15),transparent_35%)]" />
        
        {/* Added max-w-7xl and mx-auto to center content and prevent overflow */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Remote Jobs
                </span>
              </h1>
              <p className="text-lg text-gray-300">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            <button
              onClick={handleSyncJobs}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? 'Syncing...' : 'Sync Jobs (RemoteOK + Arbeitnow)'}
            </button>
          </div>

          {/* Statistics */}
          {salaryStats && salaryStats.maxSalary > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent border border-yellow-300/30 rounded-lg p-4">
                <div className="text-2xl font-black text-yellow-300">${(salaryStats.minSalary / 1000).toFixed(0)}k</div>
                <div className="text-sm text-gray-300">Minimum Salary</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 via-orange-400/5 to-transparent border border-red-300/30 rounded-lg p-4">
                <div className="text-2xl font-black text-red-300">${(salaryStats.maxSalary / 1000).toFixed(0)}k</div>
                <div className="text-sm text-gray-300">Maximum Salary</div>
              </div>
              <div className="bg-gradient-to-br from-orange-400/10 via-red-500/5 to-transparent border border-orange-400/30 rounded-lg p-4">
                <div className="text-2xl font-black text-purple-300">${(salaryStats.averageSalary / 1000).toFixed(0)}k</div>
                <div className="text-sm text-gray-300">Average Salary</div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">{error}</div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-2xl">
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Search Jobs</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Job title, company..."
                      className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer"
                  >
                    <option className="bg-gray-900" value="newest">Newest First</option>
                    <option className="bg-gray-900" value="salary-high">Highest Salary</option>
                    <option className="bg-gray-900" value="salary-low">Lowest Salary</option>
                    <option className="bg-gray-900" value="company">By Company</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer"
                  >
                    <option className="bg-gray-900" value="">All Locations</option>
                    {availableLocations.map((location) => (
                      <option key={location} className="bg-gray-900" value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-3 block">Work Location Type</label>
                  <div className="space-y-2">
                    {['digital', 'onsite', 'hybrid'].map((workType) => {
                      const info = getWorkLocationDisplay(workType);
                      return (
                        <button
                          key={workType}
                          onClick={() => toggleWorkLocation(workType)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                            selectedWorkLocations.includes(workType)
                              ? 'bg-gradient-to-r from-yellow-300/10 via-orange-400/10 to-red-500/10 border border-yellow-300 text-yellow-300'
                              : 'bg-white/5 border border-white/20 text-gray-300 hover:border-yellow-300/60'
                          }`}
                        >
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                          {selectedWorkLocations.includes(workType) && <span className="ml-auto">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-3 block">Technologies</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          selectedTags.includes(tag)
                            ? 'bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black shadow-lg'
                            : 'bg-white/10 text-gray-200 border border-white/30 hover:border-yellow-300/60'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {(searchTerm || selectedTags.length > 0 || selectedLocation || selectedWorkLocations.length > 0) && (
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedTags([]); setSelectedLocation(''); setSelectedWorkLocations([]); }}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/20 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Jobs List */}
            <div className="lg:col-span-3 space-y-6">
              {paginatedJobs.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xl text-gray-400 mb-4">
                    {jobs.length === 0 ? "No jobs in database yet." : "No jobs found matching your criteria."}
                  </p>
                  {jobs.length === 0 && (
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncing}
                      className="px-6 py-2 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black font-bold rounded-lg hover:shadow-lg transition"
                    >
                      {isSyncing ? 'Syncing...' : 'Fetch Jobs Now'}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {paginatedJobs.map((job) => {
                    const compensation = getCompensationDisplay(job);
                    const workLocationInfo = getWorkLocationDisplay(job.workLocation);
                    const source = getSourceBadge(job.id);
                    const confidenceBadge = getConfidenceBadge(compensation.confidence, compensation.source);

                    return (
                      <div
                        key={job.id}
                        className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition cursor-pointer hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-yellow-400/20 overflow-hidden"
                        onClick={() => handleJobClick(job)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent flex item overflow */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${source.color}`}>
                                {source.label}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-yellow-300 transition truncate">
                              {job.title}
                            </h3>
                            <p className="text-yellow-300 font-semibold truncate">{job.company}</p>
                          </div>
                          <ArrowRight size={20} className="text-gray-400 group-hover:text-yellow-300 transition opacity-0 group-hover:opacity-100 ml-4 flex-shrink-0" />
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 break-words">{job.description}</p>

                        <div className="flex flex-wrap gap-3 items-center mb-4">
                          <div className="flex items-center gap-1 text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full">
                            <MapPin size={16} className="text-blue-400" />
                            <span className="truncate max-w-[150px]">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full">
                            <Briefcase size={16} className="text-green-400" />
                            {job.jobType}
                          </div>
                          <div className={`flex items-center gap-1 text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full ${workLocationInfo.color}`}>
                            <span>{workLocationInfo.icon}</span>
                            {workLocationInfo.label}
                          </div>
                          {compensation.value !== 'Not specified' && (
                            <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full border ${
                              compensation.confidence === 'high' 
                                ? 'text-yellow-300 bg-yellow-300/10 border-yellow-300/30'
                                : compensation.confidence === 'medium'
                                ? 'text-purple-300 bg-purple-300/10 border-purple-300/30'
                                : 'text-gray-300 bg-gray-300/10 border-gray-300/30'
                            }`}>
                              <DollarSign size={16} />
                              {compensation.value}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags?.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full border border-white/20">
                              {tag}
                            </span>
                          ))}
                          {(job.tags?.length || 0) > 4 && (
                            <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full border border-white/20">
                              +{(job.tags?.length || 0) - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={14} />
                          Posted {formatDate(job.postedDate)}
                          {confidenceBadge && (
                            <>
                              <span className="mx-2">•</span>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${confidenceBadge.color}`}>
                                {confidenceBadge.icon}
                                {confidenceBadge.text}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8 pt-6 border-t border-white/10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black shadow-lg'
                          : 'bg-white/10 text-white border border-white/20 hover:border-yellow-300/60'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Details Modal */}
        {selectedJobModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedJobModal(null)}>
            <div className="bg-zinc-950 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-white/10 p-6 flex justify-between items-start z-10">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedJobModal.title}</h2>
                  <p className="text-lg text-yellow-300 font-semibold">{selectedJobModal.company}</p>
                </div>
                <button onClick={() => setSelectedJobModal(null)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2"><MapPin size={18} /><span className="text-sm font-semibold">Location</span></div>
                    <p className="text-white font-semibold">{selectedJobModal.location}</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2"><Globe size={18} /><span className="text-sm font-semibold">Work Type</span></div>
                    <p className="text-white font-semibold">{getWorkLocationDisplay(selectedJobModal.workLocation).label}</p>
                  </div>
                </div>

                {/* ✅ Salary Breakdown Section */}
                {(selectedJobSalaryBreakdown || selectedJobWageBreakdown) && (
                  <div className="bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent border border-yellow-300/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <DollarSign className="text-yellow-300" size={20} />
                        Salary Breakdown
                      </h3>
                      {extractedSalaryInfo && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          extractedSalaryInfo.confidence === 'high'
                            ? 'text-green-400 bg-green-400/10 border-green-400/30'
                            : extractedSalaryInfo.confidence === 'medium'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                            : 'text-gray-400 bg-gray-400/10 border-gray-400/30'
                        }`}>
                          {extractedSalaryInfo.confidence === 'high' ? '✓ Verified' : 
                           extractedSalaryInfo.confidence === 'medium' ? '📝 Extracted' : '⚠️ Estimated'}
                        </span>
                      )}
                    </div>
                    
                    {extractedSalaryInfo && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">
                          {extractedSalaryInfo.source === 'description' ? 'Extracted from description:' : 'Original:'}
                        </p>
                        <p className="text-yellow-300 font-semibold">"{extractedSalaryInfo.rawText}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {selectedJobSalaryBreakdown && (
                        <>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Annual</p>
                            <p className="text-white font-bold">
                              ${selectedJobSalaryBreakdown.annual.min.toLocaleString()} - ${selectedJobSalaryBreakdown.annual.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Monthly</p>
                            <p className="text-white font-bold">
                              ${selectedJobSalaryBreakdown.monthly.min.toLocaleString()} - ${selectedJobSalaryBreakdown.monthly.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Weekly</p>
                            <p className="text-white font-bold">
                              ${selectedJobSalaryBreakdown.weekly.min.toLocaleString()} - ${selectedJobSalaryBreakdown.weekly.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Daily</p>
                            <p className="text-white font-bold">
                              ${selectedJobSalaryBreakdown.daily.min.toLocaleString()} - ${selectedJobSalaryBreakdown.daily.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 col-span-2">
                            <p className="text-xs text-gray-400 mb-1">Hourly</p>
                            <p className="text-white font-bold">
                              ${selectedJobSalaryBreakdown.hourly.min.toLocaleString()} - ${selectedJobSalaryBreakdown.hourly.max.toLocaleString()}/hr
                            </p>
                          </div>
                        </>
                      )}
                      
                      {/* Render Wage Breakdown if available */}
                      {selectedJobWageBreakdown && !selectedJobSalaryBreakdown && (
                         <>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Annual Equivalent</p>
                            <p className="text-white font-bold">
                              ${selectedJobWageBreakdown.annual.min.toLocaleString()} - ${selectedJobWageBreakdown.annual.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Monthly Equivalent</p>
                            <p className="text-white font-bold">
                              ${selectedJobWageBreakdown.monthly.min.toLocaleString()} - ${selectedJobWageBreakdown.monthly.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Weekly Equivalent</p>
                            <p className="text-white font-bold">
                              ${selectedJobWageBreakdown.weekly.min.toLocaleString()} - ${selectedJobWageBreakdown.weekly.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Daily Equivalent</p>
                            <p className="text-white font-bold">
                              ${selectedJobWageBreakdown.daily.min.toLocaleString()} - ${selectedJobWageBreakdown.daily.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 col-span-2">
                            <p className="text-xs text-gray-400 mb-1">Hourly Rate</p>
                            <p className="text-white font-bold">
                              ${selectedJobWageBreakdown.hourly.min.toLocaleString()} - ${selectedJobWageBreakdown.hourly.max.toLocaleString()}/hr
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ Job Description with Translation */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">Job Description</h3>
                    
                    <div className="flex items-center gap-2">
                      {wasTranslated && translatedDescription && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/30">
                          Translated from {detectedLanguage}
                        </span>
                      )}
                      
                      {translatedDescription ? (
                        <button
                          onClick={handleShowOriginal}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 border border-white/20 text-gray-300 rounded-lg hover:bg-white/20 transition"
                        >
                          <Languages size={14} />
                          Show Original
                        </button>
                      ) : (
                        <button
                          onClick={handleTranslate}
                          disabled={isTranslating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Translating...
                            </>
                          ) : (
                            <>
                              <Languages size={14} />
                              Translate to English
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {translationError && (
                    <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs">
                      {translationError}
                    </div>
                  )}

                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm break-words">
                      {isTranslating ? (
                        <span className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 size={16} className="animate-spin" />
                          Translating to English...
                        </span>
                      ) : translatedDescription ? (
                        translatedDescription
                      ) : (
                        selectedJobModal.description
                      )}
                    </p>
                  </div>
                </div>

                {selectedJobModal.tags && selectedJobModal.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobModal.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-full text-sm">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-zinc-950 border-t border-white/10 p-6 flex gap-4">
                <button onClick={() => setSelectedJobModal(null)} className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition">
                  Close
                </button>
                <a
                  href={selectedJobModal.applicationUrl || selectedJobModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black font-bold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
