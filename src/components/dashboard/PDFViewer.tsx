'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  pdfUrl: string;
  fileName: string;
  onDownload?: () => void;
}

export default function PDFViewer({ pdfUrl, fileName, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify the blob URL is valid
        if (!pdfUrl || !pdfUrl.startsWith('blob:')) {
          throw new Error('Invalid PDF URL');
        }

        // Fetch the blob to check its content
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const pdfjsLib = await import('pdfjs-dist');
        // Use the worker from the public folder
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // Load the PDF with better error handling using the typed array
        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.269/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);

        // Render first page
        const page = await pdf.getPage(1);
        await renderPage(page);
      } catch (err: any) {
        setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDF();
    }

    // Cleanup
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (pdfRef.current) {
        pdfRef.current.destroy();
      }
    };
  }, [pdfUrl]);

  const renderPage = async (page: any) => {
    if (!canvasRef.current) {
      return;
    }

    // Prevent multiple simultaneous renders
    if (isRendering) {
      return;
    }

    // Cancel any existing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      setIsRendering(true);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        setError('Failed to render page');
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1 || !pdfRef.current || isRendering) return;
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    try {
      const page = await pdfRef.current.getPage(newPage);
      await renderPage(page);
    } catch (err) {
      setError('Failed to load page');
    }
  };

  const handleNextPage = async () => {
    if (currentPage >= numPages || !pdfRef.current || isRendering) return;
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    try {
      const page = await pdfRef.current.getPage(newPage);
      await renderPage(page);
    } catch (err) {
      setError('Failed to load page');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-red-50 border border-red-200 rounded">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
      </div>
      <div className="border rounded bg-white overflow-auto" style={{ maxHeight: '600px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
