'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FirestoreProject } from '@/lib/firestore';
import { BookOpen, Clock, Github, ArrowRight, Shield, Search, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);

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
    { id: 'all', name: 'All Projects', icon: Shield },
    { id: 'web-security', name: 'Web Security', icon: Shield },
    { id: 'network-security', name: 'Network Security', icon: Shield },
    { id: 'pen-testing', name: 'Penetration Testing', icon: Shield },
    { id: 'forensics', name: 'Digital Forensics', icon: Search },
    { id: 'fundamentals', name: 'Fundamentals', icon: BookOpen },
    { id: 'application-security', name: 'App Security', icon: Shield },
    { id: 'protocols', name: 'Protocols', icon: Shield }
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.categories.includes(selectedCategory));

  const getDifficultyBadge = (difficulty: number) => {
    const configs = {
      1: { label: 'Beginner', className: 'bg-green-100 text-green-800' },
      2: { label: 'Beginner+', className: 'bg-green-100 text-green-800' },
      3: { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Advanced', className: 'bg-red-100 text-red-800' },
      5: { label: 'Expert', className: 'bg-red-100 text-red-800' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">Dashboard</Link>
            <Link href="/projects" className="text-orange-600 font-medium">Projects</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">Certificates</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cybersecurity Projects</h1>
          <p className="text-gray-600">Choose a project to start translating cybersecurity documentation into Armenian</p>
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
            <p className="text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Empty State with Seed Data Option */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm border">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating some example projects to test the translation system.
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
                    Create Example Projects
                  </Button>
                  <p className="text-sm text-gray-500">
                    This will create sample cybersecurity projects with documentation files for translation.
                  </p>
                </div>
              )}
              
              {!user && (
                <div className="text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Please log in to create example projects.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
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
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Translation Progress</span>
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
                        <span>{project.estimatedHours || 0}h estimated</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          v{project.version}
                        </Badge>
                      </div>
                    </div>

                    {/* File Count */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{project.files?.length || 0}</span> documentation files
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1">
                      {project.categories.slice(0, 2).map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category.replace('-', ' ')}
                        </Badge>
                      ))}
                      {project.categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.categories.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={project.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View project source code on GitHub"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          Repository
                        </a>
                      </Button>
                      
                      {project.availableForTranslation ? (
                        <Link href={`/projects/${project.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700"
                            title="Start translating this project to Armenian"
                          >
                            Start Translation
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled
                          title="This project has been fully translated"
                        >
                          Complete
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
        {!loading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              No cybersecurity projects match your current filter.
            </p>
            <Button 
              onClick={() => setSelectedCategory('all')}
              variant="outline"
            >
              View All Projects
            </Button>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && projects.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">{projects.length}</div>
                  <div className="text-sm text-gray-600">Total Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {projects.filter(p => p.availableForTranslation).length}
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {projects.reduce((total, p) => total + (p.files?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Files</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {new Set(projects.flatMap(p => p.categories)).size}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        {!loading && projects.length > 0 && user && (
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
        )}
      </div>
    </div>
  );
} 