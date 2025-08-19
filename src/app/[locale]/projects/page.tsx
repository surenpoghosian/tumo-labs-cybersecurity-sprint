/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FirestoreProject } from '@/lib/firestore';
import { BookOpen, Clock, Github, ArrowRight, Shield, Search, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link";
import AppHeader from '@/components/ui/AppHeader';
import MobileRestriction, { useMobileRestriction } from '@/components/ui/MobileRestriction';
import { useTranslations } from 'next-intl';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Mobile restriction check
  const { shouldRestrict, isLoading: mobileLoading } = useMobileRestriction();
  
  // Translations
  const projects_ = useTranslations('Projects');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data || []);
      } else {
        console.error('Failed to fetch projects:', result.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'seed' }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Example data created successfully!');
        await fetchProjects(); // Refresh projects list
      } else {
        alert(`Failed to create example data: ${result.message}`);
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error creating example data');
    } finally {
      setIsSeeding(false);
    }
  };

  const categories = [
    { id: 'all', name: projects_('categories.all'), icon: Shield },
    { id: 'web-security', name: projects_('categories.webSecurity'), icon: Shield },
    { id: 'network-security', name: projects_('categories.networkSecurity'), icon: Shield },
    { id: 'pen-testing', name: projects_('categories.penetrationTesting'), icon: Shield },
    { id: 'forensics', name: projects_('categories.digitalForensics'), icon: Search },
    { id: 'fundamentals', name: projects_('categories.fundamentals'), icon: BookOpen },
    { id: 'application-security', name: projects_('categories.applicationSecurity'), icon: Shield },
    { id: 'protocols', name: projects_('categories.protocols'), icon: Shield }
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.categories.includes(selectedCategory));

  const getDifficultyBadge = (difficulty: number) => {
    const configs = {
      1: { label: projects_('difficulty.beginner'), className: 'bg-green-100 text-green-800' },
      2: { label: projects_('difficulty.beginnerPlus'), className: 'bg-green-100 text-green-800' },
      3: { label: projects_('difficulty.intermediate'), className: 'bg-yellow-100 text-yellow-800' },
      4: { label: projects_('difficulty.advanced'), className: 'bg-red-100 text-red-800' },
      5: { label: projects_('difficulty.expert'), className: 'bg-red-100 text-red-800' },
    };
    
    const config = configs[difficulty as keyof typeof configs] || configs[3];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryIcon = (categories: string[]) => {
    const iconClass = "h-5 w-5 text-orange-600";
    const primaryCategory = categories[0] || 'fundamentals';
    
    switch (primaryCategory) {
      case 'web-security':
      case 'application-security':
        return <Shield className={iconClass} />;
      case 'network-security':
      case 'protocols':
        return <Shield className={iconClass} />;
      case 'pen-testing':
        return <Shield className={iconClass} />;
      case 'forensics':
        return <Search className={iconClass} />;
      case 'fundamentals':
      case 'education':
        return <BookOpen className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  // Show mobile restriction if on mobile
  if (!mobileLoading && shouldRestrict) {
    return (
      <MobileRestriction 
        title={projects_('mobile.title')}
        description={projects_('mobile.description')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <AppHeader currentPage="projects" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{projects_('title')}</h1>
          <p className="text-gray-600">{projects_('subtitle')}</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-orange-600 hover:bg-orange-700" : ""}
                title={`Filter projects by ${category.name.toLowerCase()}`}
              >
                <category.icon className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{projects_('loading')}</p>
          </div>
        )}

        {/* Empty State with Seed Data Option */}
        {!loading && projects?.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm border">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{projects_('noProjects')}</h3>
              <p className="text-gray-600 mb-6">
                {projects_('noProjectsDescription')}
              </p>
              
              {user && (
                <div className="space-y-3">
                  <Button 
                    onClick={handleSeedData} 
                    disabled={isSeeding}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSeeding ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {projects_('createExampleProjects')}
                  </Button>
                  <p className="text-sm text-gray-500">
                    {projects_('createExampleDescription')}
                  </p>
                </div>
              )}
              
              {!user && (
                <div className="text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {projects_('loginRequired')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(project.categories)}
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <p className="text-sm text-gray-500">by {project.developedBy}</p>
                      </div>
                    </div>
                    {getDifficultyBadge(project.difficulty)}
                  </div>
                  <CardDescription className="mt-4">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{projects_('projectCard.translationProgress')}</span>
                        <span>{project.translationProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.translationProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{project.estimatedHours || 0}h {projects_('projectCard.estimatedTime')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          v{project.version}
                        </Badge>
                      </div>
                    </div>

                    {/* File Count */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{project.files?.length || 0}</span> {projects_('projectCard.documentationFiles')}
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1">
                      {project.categories.slice(0, 2).map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category.replace('-', ' ')}
                        </Badge>
                      ))}
                      {project.categories?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.categories?.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={project.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View project source code on GitHub"
                        >
                          <Github className="h-4 w-4 mr-1" />
                        </a>
                      </Button>
                      
                      {project.availableForTranslation ? (
                        <Link href={`/projects/${project.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700"
                            title="Start translating this project to Armenian"
                          >
                            {projects_('projectCard.startTranslation')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled
                          title={projects_('projectCard.projectFullyTranslated')}
                        >
                          {projects_('projectCard.complete')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && projects?.length > 0 && filteredProjects?.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{projects_('noProjectsFound')}</h3>
            <p className="text-gray-600 mb-4">
              {projects_('noProjectsFoundDescription')}
            </p>
            <Button 
              onClick={() => setSelectedCategory('all')}
              variant="outline"
            >
              {projects_('viewAllProjects')}
            </Button>
          </div>
        )}
       {/* Stats Summary
        {!loading && projects?.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">{projects?.length}</div>
                  <div className="text-sm text-gray-600">{t('stats.totalProjects')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {projects.filter(p => p.availableForTranslation)?.length}
                  </div>
                  <div className="text-sm text-gray-600">{t('stats.available')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {projects.reduce((total, p) => total + (p.files?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">{t('stats.totalFiles')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {new Set(projects.flatMap(p => p.categories)).size}
                  </div>
                  <div className="text-sm text-gray-600">{t('stats.categories')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
       

        {/* Admin Actions
        {!loading && projects?.length > 0 && user && (
          <div className="mt-6 text-center">
            <Button 
              onClick={handleSeedData} 
              disabled={isSeeding}
              variant="outline"
              size="sm"
            >
              {isSeeding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Add More Example Data
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
} 