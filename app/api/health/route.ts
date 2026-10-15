export async function GET() {
  return Response.json({
    ok: true,
    hora: new Date().toISOString(),
    baseDeDatosConfigurada: Boolean(process.env.DATABASE_URL),
  });
}
