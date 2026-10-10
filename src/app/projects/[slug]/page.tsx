export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  return <main className="page"><h1 className="h1 wrap">{slug}</h1></main>;
}
