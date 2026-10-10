export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  return <div className="po"><p className="wrap">overlay: {slug}</p></div>;
}
