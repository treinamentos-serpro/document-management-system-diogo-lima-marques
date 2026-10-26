import DownloadButton from './DownloadButton.jsx';

export default function DocumentList({ documents, isLoading, error, onRefresh }) {
  return (
    <section aria-labelledby="documents-heading" aria-busy={isLoading}>
      <h2 id="documents-heading">Documentos</h2>
      <button type="button" onClick={onRefresh} disabled={isLoading}>
        Atualizar lista
      </button>
      {isLoading && <p role="status">Carregando documentos...</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && documents.length === 0 && (
        <p>Nenhum documento enviado.</p>
      )}
      {documents.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <caption>Documentos disponíveis para download</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho (bytes)</th>
                <th scope="col">Data de envio</th>
                <th scope="col">Dono</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>{document.originalName}</td>
                  <td>{document.size.toLocaleString('pt-BR')}</td>
                  <td>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
                  <td>{document.owner}</td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
