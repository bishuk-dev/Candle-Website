import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductZoom from '../components/ProductZoom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { Star } from 'lucide-react';
import ProductCard from '../components/ui/Cards/ProductCard';
import PageBanner from '../components/ui/PageBanner';
import { useSingleProduct } from '../hooks/useProducts';

const ShopDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const { data, isLoading } = useSingleProduct(id);
  
  // Extracting data safely
  const product = data?.product;
  const similarProducts = data?.similarProducts || [];
  const reviews = data?.reviews || [];
  
  const { liked, toggleWishlist } = useWishlist(id);
  
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    window.scrollTo(0, 0);
    setQty(1);
  }, [id]);

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center pt-24 text-center">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center pt-24 text-center">
        <div>
          <h2 className="text-3xl font-serif text-[#222] mb-4">Product Not Found</h2>
          <Link to="/collections" className="text-[#ff5a5f] hover:underline">Return to Collections</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-yellow pb-1">
      <PageBanner 
        title="Shop Details" 
        currentPage="Shop Details" 
        productName={product.name}
      />
      
      <div className="container mx-auto py-5 px-4 lg:px-8 w-full">
        <ProductZoom product={product} />
        
        {/* Tabs Area */}
        <div className="mt-8">
          <div className="flex border-b border-gray-200 gap-8 md:gap-10">
            {['description', 'additional', 'reviews'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs cursor-pointer font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab === 'reviews' ? `Reviews (${reviews?.length || 0})` : tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />}
              </button>
            ))}
          </div>

          <div className="py-10 min-h-[200px]">
            {activeTab === 'description' && (
              <div className="text-gray-600 text-[15px] leading-8 max-w-4xl">
                <p>{product.description}</p>
              </div>
            )}
            
            {activeTab === 'additional' && (
              <div className="text-gray-600 text-sm max-w-lg">
                <div className="grid grid-cols-2 py-3 border-b border-gray-100">
                  <span className="font-bold text-black uppercase tracking-wider">Weight</span>
                  <span>{product.weight} g</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b border-gray-100">
                  <span className="font-bold text-black uppercase tracking-wider">Materials</span>
                  <span>{product.material}</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b border-gray-100">
                  <span className="font-bold text-black uppercase tracking-wider">Burn Time</span>
                  <span>~{product.burnTime} Hours</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {product.reviews?.length === 0 && (
                  <p className="text-gray-400 italic">No reviews yet for this product.</p>
                )}
                {product.reviews?.map((review, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-8">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-bold text-black uppercase tracking-widest text-xs">{review.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            fill={i < review.rating ? "black" : "none"} 
                            className={i < review.rating ? "text-black" : "text-gray-200"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        <div>
          <span className="title-span">- You may also like -</span>
          <h2 className="heading-1 mb-5">
            Similar <span className="text-coffee"> Products </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;