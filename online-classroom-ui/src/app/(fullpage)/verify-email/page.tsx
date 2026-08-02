"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmailToken } from '@/lib/actions/auth.action';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác minh email của bạn...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link không hợp lệ hoặc bị thiếu token.');
      return;
    }

    const verify = async () => {
      const result = await verifyEmailToken(token);
      if (result.success) {
        setStatus('success');
        setMessage(result.success);
        // Tự động chuyển về profile sau 3s
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Xác minh thất bại.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-lg text-center max-w-md w-full">
        {status === 'loading' && (
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        )}
        
        <p className={`text-lg font-medium mt-4 ${
          status === 'success' ? 'text-green-700' :
          status === 'error' ? 'text-red-700' : 'text-gray-700'
        }`}>
          {message}
        </p>

        {(status === 'success' || status === 'error') && (
          <Link href="/profile" className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Về trang cá nhân
          </Link>
        )}
      </div>
    </div>
  );
}

// Bọc trong Suspense để dùng useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}