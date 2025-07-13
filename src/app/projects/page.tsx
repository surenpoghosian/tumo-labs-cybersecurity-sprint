'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CyberSecProject } from "@/data/mockData";
import { BookOpen, Clock, Github, ArrowRight, Shield, Search } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<CyberSecProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        setProjects(result.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const categories = [
    { id: 'all', name: 'All Projects', icon: Shield },
    { id: 'web-security', name: 'Web Security', icon: Shield },
    { id: 'network-security', name: 'Network Security', icon: Shield },
    { id: 'pen-testing', name: 'Penetration Testing', icon: Shield },
    { id: 'forensics', name: 'Digital Forensics', icon: Shield },
    { id: 'malware-analysis', name: 'Malware Analysis', icon: Shield }
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-5 w-5 text-orange-600";
    switch (category) {
      case 'web-security': return <Shield className={iconClass} />;
      case 'network-security': return <Shield className={iconClass} />;
      case 'pen-testing': return <Shield className={iconClass} />;
      case 'forensics': return <Search className={iconClass} />;
      case 'malware-analysis': return <Shield className={iconClass} />;
      default: return <BookOpen className={iconClass} />;
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

        {/* Projects Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(project.category)}
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-gray-500">by {project.owner}</p>
                      </div>
                    </div>
                    <Badge 
                      className={getDifficultyColor(project.difficulty)}
                    >
                      {project.difficulty}
                    </Badge>
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
                        <span>{project.translationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.translationProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{project.estimatedHours}h estimated</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {project.category.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                      <a 
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-orange-600 text-sm"
                        title="View project source code on GitHub"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        View Repository
                      </a>
                      
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
                          Translation Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
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
                    {Math.round(projects.reduce((acc, p) => acc + p.translationProgress, 0) / projects.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg. Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {new Set(projects.map(p => p.category)).size}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 