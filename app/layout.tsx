import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Torneos",
  description: "Gestión de torneos de artes marciales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="barra">
          <strong>Torneos</strong>
          <nav>
            <Link href="/">Inicio</Link>
            <Link href="/competencias">Competencias</Link>
            <Link href="/participantes">Participantes</Link>
            <Link href="/brackets">Brackets</Link>
            <Link href="/panel">Panel en vivo</Link>
          </nav>
        </header>
        <div className="contenedor">{children}</div>
      </body>
    </html>
  );
}
