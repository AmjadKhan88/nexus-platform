import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Star } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async (filter?: string) => {
    try {
      const params = filter && filter !== 'all' ? `?filter=${filter}` : '';
      const { data } = await api.get(`/documents${params}`);
      setDocuments(data.documents || []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(activeFilter);
  }, [activeFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments((prev) => [data.document, ...prev]);
      toast.success('Document uploaded successfully');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      toast.success('Document moved to trash');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleStar = async (id: string) => {
    try {
      const { data } = await api.put(`/documents/${id}/star`);
      setDocuments((prev) =>
        prev.map((d) => (d._id === id ? { ...d, starred: data.document.starred } : d))
      );
    } catch {
      toast.error('Failed to update document');
    }
  };

  const handleDownload = (doc: any) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${doc.url}`;
    link.download = doc.originalName || doc.name;
    link.click();
  };

  const filters = [
    { key: 'all', label: 'All Files' },
    { key: 'recent', label: 'Recent' },
    { key: 'shared', label: 'Shared with Me' },
    { key: 'starred', label: 'Starred' },
    { key: 'trash', label: 'Trash' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.svg"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Quick Access</h2>
          </CardHeader>
          <CardBody className="p-2">
            <nav className="space-y-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeFilter === f.key
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {filters.find((f) => f.key === activeFilter)?.label || 'Documents'}
              </h2>
              <Badge variant="gray">{documents.length} files</Badge>
            </CardHeader>
            <CardBody>
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading documents...</p>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FileText size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600">No documents found</p>
                  <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                          {doc.shared && <Badge variant="secondary" size="sm">Shared</Badge>}
                          {doc.starred && <Badge variant="accent" size="sm">⭐ Starred</Badge>}
                          {doc.status === 'signed' && <Badge variant="success" size="sm">Signed</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleStar(doc._id)}
                          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                            doc.starred ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                          title="Star"
                        >
                          <Star size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-500"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 rounded hover:bg-gray-100 transition-colors text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
