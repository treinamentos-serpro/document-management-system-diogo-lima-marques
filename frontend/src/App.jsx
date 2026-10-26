import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/api.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);
      setError('');
      try {
        const records = await listDocuments({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setDocuments(records);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshVersion]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <UploadComponent onUpload={refreshDocuments} />
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </main>
  );
}
