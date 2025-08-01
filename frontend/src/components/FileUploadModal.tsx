import React, { useState, useRef } from 'react';
import { X, Upload, File, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface FileUploadInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesUploaded: (files: FileList) => void;
  taskId?: string; // Add taskId to properly upload files to the backend
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFilesUploaded,
  taskId = `task-${Date.now()}`, // Default task ID if none provided
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = ['.txt', '.pdf', '.doc', '.docx', '.json', '.csv', '.py', '.js', '.html', '.css', '.md']
}) => {
  const [uploadFiles, setUploadFiles] = useState<FileUploadInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('🎯 RENDERING FileUploadModal with isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('❌ FileUploadModal not showing - isOpen is false');
    return null;
  }
  
  console.log('✅ FileUploadModal is showing - isOpen is true');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Máximo ${maxFileSize}MB permitido.`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(fileExtension)) {
      return `Tipo de archivo no permitido. Tipos aceptados: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const addFiles = (files: FileList) => {
    const newFiles: FileUploadInfo[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if we haven't exceeded max files
      if (uploadFiles.length + newFiles.length >= maxFiles) {
        break;
      }

      // Check if file is already added
      const isDuplicate = uploadFiles.some(uf => 
        uf.file.name === file.name && uf.file.size === file.size
      );

      if (isDuplicate) continue;

      const validation = validateFile(file);
      
      newFiles.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: validation ? 'error' : 'pending',
        error: validation || undefined
      });
    }

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const simulateUploadForUI = async (fileInfo: FileUploadInfo) => {
    // Just simulate UI progress - the actual upload will be handled by ChatInterface
    setUploadFiles(prev => prev.map(f => 
      f.id === fileInfo.id ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    // Simulate progress for better UX
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { ...f, progress } : f
      ));
    }

    setUploadFiles(prev => prev.map(f => 
      f.id === fileInfo.id ? { ...f, status: 'completed', progress: 100 } : f
    ));
  };

  const uploadAllFiles = async () => {
    const validFiles = uploadFiles.filter(f => f.status === 'pending');
    
    // Si no hay archivos pendientes, no hacer nada
    if (validFiles.length === 0) {
      return;
    }
    
    console.log(`🚀 Starting UI upload simulation for ${validFiles.length} files`);
    
    // Simulate uploading all pending files for UI feedback
    try {
      for (const fileInfo of validFiles) {
        await simulateUploadForUI(fileInfo);
      }
      
      console.log('✅ All files simulated for UI - ready for actual upload');
    } catch (error) {
      console.error('❌ Error during UI simulation:', error);
    }
  };

  const handleConfirmUpload = () => {
    const completedFiles = uploadFiles.filter(f => f.status === 'completed');
    if (completedFiles.length > 0) {
      const fileList = new DataTransfer();
      completedFiles.forEach(fileInfo => {
        fileList.items.add(fileInfo.file);
      });

      onFilesUploaded(fileList.files);
      handleClose();
    }
  };

  const handleClose = () => {
    setUploadFiles([]);
    onClose();
  };

  const validFiles = uploadFiles.filter(f => f.status !== 'error');
  const errorFiles = uploadFiles.filter(f => f.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#272728] rounded-xl border border-[rgba(255,255,255,0.08)] w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#DADADA]" />
            <h2 className="text-lg font-bold text-[#DADADA]">Subir Archivos</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#383739] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#DADADA]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-colors cursor-pointer ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-[#7f7f7f] mx-auto mb-4" />
            <p className="text-[#DADADA] mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-[#7f7f7f]">
              Máximo {maxFiles} archivos, {maxFileSize}MB cada uno
            </p>
            <p className="text-xs text-[#7f7f7f] mt-1">
              Tipos aceptados: {acceptedTypes.join(', ')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Files List */}
          {uploadFiles.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <h3 className="text-sm font-medium text-[#DADADA] mb-3">
                Archivos seleccionados ({uploadFiles.length}/{maxFiles})
              </h3>
              
              <div className="space-y-2">
                {uploadFiles.map((fileInfo) => (
                  <div
                    key={fileInfo.id}
                    className={`flex items-center p-3 rounded-lg border transition-colors ${
                      fileInfo.status === 'error' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : fileInfo.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-[#383739] border-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <File className="w-5 h-5 text-[#7f7f7f] mr-3 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#DADADA] truncate">
                        {fileInfo.name}
                      </p>
                      <p className="text-xs text-[#7f7f7f]">
                        {formatFileSize(fileInfo.size)}
                      </p>
                      
                      {fileInfo.status === 'error' && fileInfo.error && (
                        <p className="text-xs text-red-400 mt-1">{fileInfo.error}</p>
                      )}
                      
                      {fileInfo.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-[#2A2A2B] rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${fileInfo.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-[#7f7f7f] mt-1">{fileInfo.progress}%</p>
                        </div>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="ml-3 flex-shrink-0">
                      {fileInfo.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {fileInfo.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      {fileInfo.status === 'uploading' && (
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                      )}
                    </div>

                    {/* Remove Button */}
                    {fileInfo.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(fileInfo.id)}
                        className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {uploadFiles.length > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <div className="text-sm text-[#7f7f7f]">
                {validFiles.length} archivo(s) válido(s)
                {errorFiles.length > 0 && `, ${errorFiles.length} con errores`}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#383739] hover:bg-[#404142] rounded-lg text-sm text-[#DADADA] transition-colors"
                >
                  Cancelar
                </button>
                
                {/* Mostrar botón de subir solo si hay archivos pendientes */}
                {validFiles.filter(f => f.status === 'pending').length > 0 && (
                  <button
                    onClick={uploadAllFiles}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Subir {validFiles.filter(f => f.status === 'pending').length} archivo(s)
                  </button>
                )}
                
                {/* Mostrar botón de confirmar solo si hay archivos completados */}
                {uploadFiles.some(f => f.status === 'completed') && (
                  <button
                    onClick={handleConfirmUpload}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Confirmar y Adjuntar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};