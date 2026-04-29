import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import content from '../content.json';

export default function Blog() {
  const posts = content.blog || [
    {
      title: 'The Evolution of the Air Force 1',
      excerpt: 'From the basketball courts of the 80s to the runways of Paris, explore the journey of an icon.',
      category: 'Heritage',
      date: 'April 18, 2024',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800',
    },
    {
      title: 'Sustainability in Modern Footwear',
      excerpt: 'How leading brands like Nike and Adidas are engineering the future with recycled materials.',
      category: 'Innovation',
      date: 'April 15, 2024',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800',
    },
    {
      title: 'The Rise of the Dad Shoe',
      excerpt: 'Analyzing the New Balance phenomenon and the shift towards functional comfort.',
      category: 'Trends',
      date: 'April 12, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800',
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* ── Hero ── */}
      <section className="relative w-full h-[28vh] bg-gray-900 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1600&auto=format&fit=crop"
            alt="Sneaker Culture Blog"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-2xl bg-white/90 backdrop-blur-sm m-6 md:ml-12 rounded-2xl border border-gray-100 shadow-lg">
           <h3 className="text-xs font-black uppercase tracking-[0.5em] text-[#ff3366] mb-4">THE JOURNAL</h3>
           <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-3">
               L&S <span className="text-[#ff3366]">Blog</span>
           </h1>
           <p className="text-gray-500 font-medium leading-relaxed">
             Insights, guides, and stories from the epicenter of sneaker culture.
           </p>
        </div>
      </section>

      {/* ── Posts ── */}
      <section className="py-6 max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="relative aspect-[16/9] rounded-[24px] overflow-hidden mb-4 shadow-sm border border-gray-100 bg-gray-50">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6 bg-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
                  {post.category}
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>{post.date}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <span>{post.readTime}</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900 group-hover:text-[#ff3366] transition-colors">
                {post.title}
              </h3>
              <p className="text-sm font-bold text-gray-500 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-12 bg-gray-50 border-t border-gray-100 mx-6 rounded-3xl">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
            Stay <span className="text-[#ff3366]">Updated</span>
          </h2>
          <p className="text-sm font-bold text-gray-500 mb-10 tracking-wide">Get the latest drops and stories delivered to your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 h-12 bg-white rounded-2xl px-6 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-all shadow-sm"
            />
            <button className="h-12 px-10 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#ff3366] transition-colors shadow-md shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
