import { useState, useEffect } from 'react';

/**
 * Example usage: Handling data fetching, return data, loading state, and error.
 * 
 * const { data, error, loading } = useFetch('https://api.example.com/data');
 * 
 * if (loading) return <p>Loading...</p>;
 * if (error) return <p>Error: {error.message}</p>;
 * return <div>{JSON.stringify(data)}</div>;
 * 
 * @param url The URL to fetch data from.
 * @returns An object containing the fetched data, loading state, and error (if any).
 */

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(url);
        console.log('response:',response);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        console.log('result:',result);
        setData(result.result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

export default useFetch;
