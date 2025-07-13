import { NextResponse } from 'next/server';
import { getCurrentUser, getUserTranslationProjects, getCertificatesByUserId } from '@/data/mockData';

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const user = getCurrentUser();
  const userProjects = getUserTranslationProjects(user.id);
  const userCertificates = getCertificatesByUserId(user.id);
  
  const stats = {
    totalProjects: userProjects.length,
    completedProjects: userProjects.filter(p => p.status === 'merged').length,
    inProgressProjects: userProjects.filter(p => p.status === 'in-progress').length,
    underReviewProjects: userProjects.filter(p => p.status === 'under-review').length,
    totalCertificates: userCertificates.length
  };
  
  return NextResponse.json({
    success: true,
    data: {
      user,
      stats,
      recentProjects: userProjects.slice(0, 3),
      recentCertificates: userCertificates.slice(0, 3)
    }
  });
} 