"use client";
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác minh email của bạn...');
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link không hợp lệ hoặc bị thiếu token.');
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const verify = async () => {
      try {
        const result = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(result.message || 'Xác thực email thành công!');
        // Tự động chuyển về profile sau 3s
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || err.message || 'Xác minh thất bại.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="p-8 bg-card shadow-lg rounded-2xl border border-border text-center max-w-md w-full">
        {status === 'loading' && (
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-12 h-12 text-state-success mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
        )}
        
        <p className={`text-lg font-medium mt-4 ${
          status === 'success' ? 'text-state-success' :
          status === 'error' ? 'text-destructive' : 'text-foreground'
        }`}>
          {message}
        </p>

        {(status === 'success' || status === 'error') && (
          <Link href="/profile" className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors">
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}