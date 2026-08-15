import React from 'react';
import { notFound } from 'next/navigation';
import HomeworkEditClient from '@/components/HomeworkEditClient';
import { serverFetch } from '@/lib/server-api';

interface PageProps {
  params: {
    id: string;
    hwId: string;
  };
}

export default async function EditHomeworkPage({ params }: PageProps) {
  const homeworkId = parseInt(params.hwId, 10);
  
  if (isNaN(homeworkId)) {
    notFound();
  }

  try {
    const homework = await serverFetch(`/homework/${homeworkId}`);
    
    if (!homework) {
      notFound();
    }

    return (
      <div className="bg-white">
        <HomeworkEditClient homework={homework} classId={params.id} />
      </div>
    );
  } catch (error) {
    console.error('Error loading homework for edit:', error);
    notFound();
  }
}
