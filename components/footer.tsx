import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-white">
              JobAlert
            </h2>

            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Get matched with the best remote, digital,
              hybrid, and onsite opportunities delivered
              directly to your inbox.
            </p>

            <div className="flex gap-4 mt-6 text-xl">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaFacebook />
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaInstagram />
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaLinkedin />
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaYoutube />
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
              >
                <FaXTwitter />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white">
              Company
            </h4>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition"
                >
                  Blog
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4 text-white">
              Resources
            </h4>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/jobs"
                  className="hover:text-white transition"
                >
                  Browse Jobs
                </Link>
              </li>

              <li>
                <Link
                  href="/alerts"
                  className="hover:text-white transition"
                >
                  Job Alerts
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-white">
              Contact
            </h4>

            <div className="space-y-3 text-sm text-gray-400">
              <p>dimejifalayi@gmail.com</p>
              <p>Lagos, Nigeria</p>

              <Link
                href="/contact"
                className="inline-block mt-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 transition"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} JobAlert. All
            rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link
              href="/privacy"
              className="hover:text-white transition"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="hover:text-white transition"
            >
              Terms of Service
            </Link>

            <Link
              href="/cookies"
              className="hover:text-white transition"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}