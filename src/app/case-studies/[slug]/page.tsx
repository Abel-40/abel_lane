export default async function Page({ params }: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  return <main className="page"><h1 className="h1 wrap">{slug}</h1></main>;
}
