import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Collections() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Hardcoding the legacy categories from the snapshot to ensure the 3x3 grid restores perfectly.
  const visualCollections = [
    { title: "Urban Explorer", subtitle: "Nike - Modern street aesthetics", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=2070&auto=format&fit=crop", link: "/collection/urban-explorer" },
    { title: "Performance Pro", subtitle: "Adidas - Built for the track", image: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=2070&auto=format&fit=crop", link: "/collection/performance-pro" },
    { title: "Vintage Lux", subtitle: "Jordan - Heritage reimagined", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2070&auto=format&fit=crop", link: "/collection/vintage-luxe" },
    { title: "Summer Breeze", subtitle: "Puma - Light & breathable", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=2070&auto=format&fit=crop", link: "/collection/summer-breeze" },
    { title: "Winter Shield", subtitle: "Durable elements protection", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=2070&auto=format&fit=crop", link: "/collection/winter-shield" },
    { title: "Junior Series", subtitle: "The next generation", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2070&auto=format&fit=crop", link: "/collection/junior-series" },
    { title: "Formal Edge", subtitle: "Reebok - Office to street", image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=2070&auto=format&fit=crop", link: "/collection/formal-edge" },
    { title: "Marathon Elite", subtitle: "Long distance champions", image: "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?q=80&w=2070&auto=format&fit=crop", link: "/collection/marathon-elite" },
    { title: "Court Classics", subtitle: "Basketball legends", image: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?q=80&w=2070&auto=format&fit=crop", link: "/collection/court-classics" },
  ];

  return (
    <div className="pb-8 bg-white min-h-screen">
      <section className="pt-4 pb-2 text-center px-6">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter">OUR <span className="text-[#ff3366]">COLLECTIONS</span></h1>
        <p className="mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] max-w-xl mx-auto">
           Curated selections for every style and purpose.
        </p>
      </section>

      <section className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-900">ALL COLLECTIONS (9)</h3>
            <div className="h-px bg-gray-200 flex-1 mx-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visualCollections.map((col, idx) => (
            <Link 
              key={idx} 
              to={col.link}
              className="group relative h-[200px] rounded-[24px] overflow-hidden block bg-gray-100 border border-gray-100 hover:shadow-lg transition-all"
            >
              <img 
                src={col.image} 
                alt={col.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-0.5">{col.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{col.subtitle}</p>
                    <span className="text-white text-[9px] font-black uppercase tracking-widest border-b border-white pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
                  </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
