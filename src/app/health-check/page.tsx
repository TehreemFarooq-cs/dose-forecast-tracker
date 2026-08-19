async function getSystemHealth() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts/1", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export default async function HealthCheckPage() {
  const data = await getSystemHealth();

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">System Health Check</h1>
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <p className="text-green-600 font-semibold">Status: Operational</p>
        <p className="text-sm text-gray-500 mt-2">Fetched Data ID: {data.id}</p>
      </div>
    </div>
  );
}