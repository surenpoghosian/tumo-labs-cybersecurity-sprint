import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Users, Award, Github, Star } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";


export default function Home() {
  const homePage = useTranslations('HomePage');
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600">Features</a>
            <a href="#process" className="text-gray-600 hover:text-blue-600">How It Works</a>
            <a href="#community" className="text-gray-600 hover:text-blue-600">Community</a>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Cybersecurity Documentation into
            <span className="block text-orange-600">Armenian</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {homePage("hero.subtitle")}
          </p>
          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Start Translating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-orange-200 hover:bg-orange-50 text-gray-700 hover:text-orange-700">
                <BookOpen className="mr-2 h-5 w-5 text-orange-600" />
                Browse Translations
              </Button>
            </Link>
          </div>

          {/* Quick Access to Translations */}
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 max-w-2xl mx-auto shadow-sm border border-orange-100">
            <div className="flex items-center mb-3">
              <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="font-medium text-gray-800">Already Translated Documents</h3>
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-200">
                New
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Access our collection of Armenian cybersecurity documentation, translated and reviewed by security experts.
              All translations are available for free.
            </p>
            <Link href="/docs" className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium">
              View documentation library
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">1,247</div>
              <div className="text-gray-600">Security Docs Translated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">89</div>
              <div className="text-gray-600">Active Security Translators</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">15</div>
              <div className="text-gray-600">CyberSec GitHub Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">47</div>
              <div className="text-gray-600">Merged Pull Requests</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Armenian CyberSec Docs?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Github className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>GitHub PR Integration</CardTitle>
                <CardDescription>
                  Direct integration with cybersecurity projects. Submit translations as pull requests and get them merged
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Security Expert Review</CardTitle>
                <CardDescription>
                  Community-driven security validation with cybersecurity expert reviews and feedback
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Earn Security Certificates</CardTitle>
                <CardDescription>
                  Get verified certificates for cybersecurity translation contributions after GitHub PR merges
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-gray-50 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a CyberSec Project</h3>
              <p className="text-gray-600">
                Browse available cybersecurity projects and select documentation that needs translation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Translate &amp; Submit PR</h3>
              <p className="text-gray-600">
                Use our editor to translate content and submit pull requests to GitHub repositories
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Security Certificates</h3>
              <p className="text-gray-600">
                Receive certificates after your PRs are merged and build your cybersecurity reputation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Join Our Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Building Armenia&apos;s Tech Future
              </h3>
              <p className="text-gray-600 mb-6">
                Every translation you contribute helps make technology more accessible to Armenian speakers.
                Join a growing community of developers, translators, and tech enthusiasts working together
                to bridge the language gap in technology education.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">OWASP</Badge>
                <Badge variant="secondary">Metasploit</Badge>
                <Badge variant="secondary">Wireshark</Badge>
                <Badge variant="secondary">Nmap</Badge>
                <Badge variant="secondary">Burp Suite</Badge>
                <Badge variant="secondary">Kali Linux</Badge>
              </div>
              <Link href="/dashboard">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  Start Contributing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Top Contributor</h4>
                  <p className="text-sm text-gray-600">Arman Petrosyan</p>
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                &quot;Contributing to Armenian Docs has been incredibly rewarding. I&apos;ve helped translate
                React documentation and earned certificates that showcase my skills to potential employers.&quot;
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Award className="h-4 w-4 mr-1" />
                <span>12 Certificates Earned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span className="text-lg font-semibold">Armenian Docs</span>
              </div>
              <p className="text-gray-400">
                Making technology accessible to Armenian speakers through community-driven translation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Projects</a></li>
                <li><a href="#" className="hover:text-white">Translation Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Quality Standards</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Discord Server</a></li>
                <li><a href="#" className="hover:text-white">Contributor Guide</a></li>
                <li><a href="#" className="hover:text-white">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report Issues</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Armenian Docs. Built with ❤️ for the Armenian tech community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
