import React from 'react';
import { getHomeworkById } from '@/lib/actions/actions';
import { notFound } from 'next/navigation';
import HomeworkEditClient from '@/components/HomeworkEditClient';

interface PageProps {
  params: {
    id: string;
    hwId: string;
  };
}

export default async function EditHomeworkPage({ params }: PageProps) {
  const homeworkId = parseInt(params.hwId);
  
  if (isNaN(homeworkId)) {
    notFound();
  }

  try {
    const homework = await getHomeworkById(homeworkId);
    
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
