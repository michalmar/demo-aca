import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';

interface UploadResponse {
  success: boolean;
  message: string;
  flashcardId?: string;
  testId?: string;
}

interface UploadedImage {
  filename: string;
  dataUrl: string;
}

interface UploadTopicProps {
  onSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const UploadTopic: React.FC<UploadTopicProps> = ({ onSuccess }) => {
  const [topicName, setTopicName] = useState('');
  const [topicText, setTopicText] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) {
      setImages([]);
      return;
    }

    setStatus('uploading');
    setMessage('Processing images…');
    setResult(null);

    try {
      const encoded = await Promise.all(
        files.map(
          file =>
            new Promise<UploadedImage>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                if (!dataUrl) {
                  reject(new Error(`Failed to read ${file.name}`));
                  return;
                }
                resolve({ filename: file.name, dataUrl });
              };
              reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );
      setImages(encoded);
      setStatus('idle');
      setMessage('');
    } catch (err) {
      setImages([]);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to process images');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicName.trim() || !topicText.trim()) {
      setStatus('error');
      setMessage('Please fill in both topic name and text.');
      return;
    }

    setStatus('uploading');
    setMessage('Generating content... This may take a moment.');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName: topicName.trim(),
          topicText: topicText.trim(),
          images: images.length ? images : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      setResult(data);
      setStatus('success');
      setMessage(data.message);
      
      // Clear form on success
      setTopicName('');
      setTopicText('');
      setImages([]);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to upload topic');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setMessage('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/90 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Upload className="h-5 w-5" />
          Upload New Topic
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Add a new topic to automatically generate flashcards and quiz questions using AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topicName" className="text-sm font-medium text-foreground">
              Topic Name
            </label>
            <Input
              id="topicName"
              type="text"
              placeholder="e.g., Renaissance Art, World War II, Photosynthesis"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              disabled={status === 'uploading'}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="topicText" className="text-sm font-medium text-foreground">
              Topic Content
            </label>
            <Textarea
              id="topicText"
              placeholder="Paste or type the educational content about this topic. This text will be used to generate flashcards and quiz questions..."
              value={topicText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopicText(e.target.value)}
              disabled={status === 'uploading'}
              className="w-full min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              The more detailed the content, the better the generated questions will be.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="topicImages" className="text-sm font-medium text-foreground">
              Optional screenshots (images)
            </label>
            <Input
              id="topicImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              disabled={status === 'uploading'}
            />
            <p className="text-xs text-muted-foreground">
              {images.length ? `${images.length} image(s) selected.` : 'Attach screenshots if the topic includes diagrams or photos.'}
            </p>
          </div>

          {/* Status Messages */}
          {status !== 'idle' && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                status === 'uploading'
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                  : status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
              }`}
            >
              {status === 'uploading' && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    status === 'uploading'
                      ? 'text-blue-800 dark:text-blue-200'
                      : status === 'success'
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {status === 'uploading' && 'Generating Content...'}
                  {status === 'success' && 'Success!'}
                  {status === 'error' && 'Error'}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    status === 'uploading'
                      ? 'text-blue-700 dark:text-blue-300'
                      : status === 'success'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {message}
                </p>
                {result && (
                  <div className="mt-2 text-xs space-y-1">
                    {result.flashcardId && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        ✓ Flashcards: {result.flashcardId}
                      </p>
                    )}
                    {result.testId && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        ✓ Quiz: {result.testId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={status === 'uploading' || !topicName.trim() || !topicText.trim()}
              className="flex items-center gap-2"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
            
            {(status === 'success' || status === 'error') && (
              <Button type="button" variant="outline" onClick={resetForm}>
                {status === 'success' ? 'Add Another Topic' : 'Try Again'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadTopic;
