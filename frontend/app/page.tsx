export default function HomePage(): React.ReactNode {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Portal do Credor — Case Administração Judicial</h1>
      <p>
        Scaffolding inicial. O frontend consome o backend apenas via gateway em{' '}
        <code>/api/v1</code>.
      </p>
      <ul>
        <li>
          Backend health: <code>/health</code> (fora do prefixo)
        </li>
        <li>
          API: <code>/api/v1/*</code>
        </li>
      </ul>
    </main>
  );
}
