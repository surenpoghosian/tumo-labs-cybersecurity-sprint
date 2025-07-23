import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Users, Award, Github, Star } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Հայկական Կիբեռանվտանգության Փաստաթղթեր</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600">Հատկանիշներ</a>
            <a href="#process" className="text-gray-600 hover:text-blue-600">Ընթացքը</a>
            <a href="#community" className="text-gray-600 hover:text-blue-600">Համայնք</a>
            <Link href="/dashboard">
              <Button variant="outline">Վահանակ</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Վերափոխեք կիբեռանվտանգության փաստաթղթերը
            <span className="block text-orange-600">հայերեն</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Կամուրջ կառուցեք Հայաստանի կիբեռանվտանգության կրթության լեզվական բացի վրա: Օգնեք թարգմանել բաց կոդով անվտանգության փաստաթղթեր, ուղարկեք GitHub PR-ներ, վաստակեք վկայագրեր և ստեղծեք ավելի ուժեղ անվտանգության համայնք Հայաստանում:
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Սկսել թարգմանել
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline">
                Դիտել նախագծերը
              </Button>
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
              <div className="text-gray-600">Թարգմանված անվտանգության փաստաթղթեր</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">89</div>
              <div className="text-gray-600">Ակտիվ անվտանգության թարգմանիչներ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">15</div>
              <div className="text-gray-600">Կիբեռանվտանգության GitHub նախագծեր</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">47</div>
              <div className="text-gray-600">Միաձուլված Pull Request-ներ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ինչու՞ ընտրել մեր հարթակը
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Github className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>GitHub PR ինտեգրում</CardTitle>
                <CardDescription>
                  Ուղղակի ինտեգրում կիբեռանվտանգության նախագծերի հետ: Ուղարկեք թարգմանությունները որպես pull request-ներ և ստացեք դրանց միաձուլումը
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Անվտանգության փորձագետների գնահատում</CardTitle>
                <CardDescription>
                  Համայնքի վարած անվտանգության վավերացում կիբեռանվտանգության փորձագետների գնահատումներով և հետադարձ կապով
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Վաստակեք անվտանգության վկայագրեր</CardTitle>
                <CardDescription>
                  Ստացեք վավերացված վկայագրեր կիբեռանվտանգության թարգմանության ներդրումների համար GitHub PR-ների միաձուլումից հետո
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
            Ինչպե՞ս է աշխատում
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ընտրեք կիբեռանվտանգության նախագիծ</h3>
              <p className="text-gray-600">
                Նավարկեք հասանելի կիբեռանվտանգության նախագծերում և ընտրեք փաստաթղթեր, որոնք կարիք ունեն թարգմանության
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Թարգմանեք և ուղարկեք PR</h3>
              <p className="text-gray-600">
                Օգտագործեք մեր խմբագիրը՝ բովանդակությունը թարգմանելու և pull request-ներ ուղարկելու GitHub պահեստներ
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Վաստակեք անվտանգության վկայագրեր</h3>
              <p className="text-gray-600">
                Ստացեք վկայագրեր ձեր PR-ների միաձուլումից հետո և կառուցեք ձեր կիբեռանվտանգության հեղինակությունը
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            /*title*/
            Միացեք մեր համայնքին
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                /*subtitle*/
                Կառուցելով Հայաստանի տեխնոլոգիական ապագան
              </h3>
              <p className="text-gray-600 mb-6">
                /*description*/
                Ամեն թարգմանություն, որ դուք ներդնում եք, օգնում է տեխնոլոգիան ավելի հասանելի դարձնել հայերեն խոսողների համար: Միացեք աճող համայնքին՝ ծրագրավորողների, թարգմանիչների և տեխնոլոգիական էնտուզիաստների, որոնք միասին կամուրջ են կառուցում տեխնոլոգիական կրթության լեզվական բացի վրա:
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
                  <h4 className="font-semibold">Լավագույն ներդրող</h4>
                  <p className="text-sm text-gray-600">Arman Petrosyan</p> /*🐞 these should be variables*/
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">
                «Հայկական փաստաթղթերին մասնակցելը շատ օգտակար էր: Ես օգնել եմ թարգմանել React-ի փաստաթղթերը և վաստակել վկայագրեր, որոնք ցույց են տալիս իմ հմտությունները ապագա գործատուներին»
              </p> /*🐞 these should be variables*/
              <div className="flex items-center text-sm text-gray-500">
                <Award className="h-4 w-4 mr-1" />
                <span>12 վաստակած վկայագիր</span> /*🐞 (12) these should be variables*/
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
                <span className="text-lg font-semibold">Հայկական փաստաթղթեր</span>
              </div>
              <p className="text-gray-400">
                Տեխնոլոգիան հասանելի դարձնել հայերեն խոսողների համար համայնքային թարգմանության միջոցով:
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Պլատֆորմ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Դիտել նախագծերը</a></li>
                <li><a href="#" className="hover:text-white">Թարգմանության ուղեցույցներ</a></li>
                <li><a href="#" className="hover:text-white">Որակի ստանդարտներ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Համայնք</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Discord սերվեր</a></li>
                <li><a href="#" className="hover:text-white">Ներդրողի ուղեցույց</a></li>
                <li><a href="#" className="hover:text-white">Միջոցառումներ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Աջակցություն</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Օգնության կենտրոն</a></li>
                <li><a href="#" className="hover:text-white">Կապ մեզ հետ</a></li>
                <li><a href="#" className="hover:text-white">Զեկուցել խնդիրների մասին</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Հայկական փաստաթղթեր։ Ստեղծված է սիրով՝ հայկական տեխնոլոգիական համայնքի համար։</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
