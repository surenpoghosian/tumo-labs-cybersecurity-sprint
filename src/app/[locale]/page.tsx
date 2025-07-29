import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Users, Award, Github, Star } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import StartTranslatingButton from '@/components/ui/StartTranslatingButton';
import AppHeader from '@/components/ui/AppHeader';


export default function Home() {
  const homePage = useTranslations('HomePage');
  const buttons = useTranslations('Buttons');
  const footer = useTranslations('Footer');
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <AppHeader currentPage="home" />

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            {homePage("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto px-2">
            {homePage("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 md:mb-8 px-4">
            <StartTranslatingButton />
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-orange-200 hover:bg-orange-50 text-gray-700 hover:text-orange-700 w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5 text-orange-600" />
                {buttons('browseTranslations')}
              </Button>
            </Link>
          </div>

          {/* Quick Access to Translations */}
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 md:p-6 max-w-2xl mx-auto shadow-sm border border-orange-100">
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="font-medium text-gray-800">{homePage('alreadyTranslatedDocs.title')}</h3>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 w-fit">
{homePage('alreadyTranslatedDocs.new')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
{homePage('alreadyTranslatedDocs.description')}
            </p>
            <Link href="/docs" className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium justify-center sm:justify-start">
{homePage('alreadyTranslatedDocs.viewLibrary')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="bg-orange-50 rounded-lg p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">1,247</div>
              <div className="text-sm md:text-base text-gray-600">{homePage('stats.securityDocsTranslated')}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">89</div>
              <div className="text-sm md:text-base text-gray-600">{homePage('stats.activeTranslators')}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">15</div>
              <div className="text-sm md:text-base text-gray-600">{homePage('stats.githubProjects')}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">47</div>
              <div className="text-sm md:text-base text-gray-600">{homePage('stats.mergedPRs')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">
            {homePage('features.whyChoose')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card>
              <CardHeader>
                <Github className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>{homePage('features.githubIntegration.title')}</CardTitle>
                <CardDescription>
                  {homePage('features.githubIntegration.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>{homePage('features.expertReview.title')}</CardTitle>
                <CardDescription>
                  {homePage('features.expertReview.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>{homePage('features.earnCertificates.title')}</CardTitle>
                <CardDescription>
                  {homePage('features.earnCertificates.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-12 md:py-20 bg-gray-50 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">
            {homePage('process.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl md:text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">{homePage('process.step1.title')}</h3>
              <p className="text-gray-600 text-sm md:text-base">
                {homePage('process.step1.description')}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-orange-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl md:text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">{homePage('process.step2.title')}</h3>
              <p className="text-gray-600 text-sm md:text-base">
                {homePage('process.step2.description')}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-orange-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl md:text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">{homePage('process.step3.title')}</h3>
              <p className="text-gray-600 text-sm md:text-base">
                {homePage('process.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">
            {homePage('community.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                {homePage('community.subtitle')}
              </h3>
              <p className="text-gray-600 mb-6">
                {homePage('community.description')}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {homePage.raw('community.projects').map((project: string, index: number) => (
                  <Badge key={index} variant="secondary">{project}</Badge>
                ))}
              </div>
              <Link href="/dashboard">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  {homePage('community.dashboard')}
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
                  <h4 className="font-semibold">{homePage('contributor.VIP')}</h4>
                  <p className="text-sm text-gray-600">Arman Petrosyan</p>
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                &quot;{homePage('community.testimonial')}&quot;
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Award className="h-4 w-4 mr-1" />
                <span>12 {homePage('contributor.certNum')}</span>
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
                <span className="text-lg font-semibold">{footer('armDocs.title')}</span>
              </div>
              <p className="text-gray-400">
                {footer('armDocs.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{footer('Platform.title')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{footer('Platform.projects')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Platform.guide')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Platform.standards')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{footer('Community.title')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{footer('Community.discord')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Community.guide')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Community.event')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{footer('Support.title')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{footer('Support.help')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Support.contact')}</a></li>
                <li><a href="#" className="hover:text-white">{footer('Support.report')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{footer('Copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
