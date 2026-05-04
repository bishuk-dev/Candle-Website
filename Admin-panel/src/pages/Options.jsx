import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useGetCustomization, useToggleOptionStatus, useDeleteOption, useInitCustomization } from '../hooks/useOptions';

const Options = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // 👉 Fetch Data & Mutations
  const { data, isLoading, isError } = useGetCustomization();
  const { mutate: toggleStatus } = useToggleOptionStatus();
  const { mutate: deleteOption } = useDeleteOption();
  const { mutateAsync: initCustomization, isPending: isInitializing } = useInitCustomization();

  const steps = data?.steps || [];
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (steps.length > 0 && !steps.find(s => s.stepNumber === activeTab)) {
      setActiveTab(steps[0].stepNumber);
    }
  }, [steps]);

  const currentStep = steps.find(s => s.stepNumber === activeTab);
  const currentOptions = currentStep?.options || [];

  // Entrance animation
  useEffect(() => {
    if (isLoading) return;
    gsap.fromTo(containerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
  }, [isLoading]);

  // Options cards animation on tab switch
  useEffect(() => {
    if (currentOptions.length > 0) {
      gsap.fromTo('.card-animate', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" });
    }
  }, [activeTab, currentOptions.length]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  // Initial Empty State
  if (isError || !data) {
    return (
      <main className="flex-1 p-6 md:p-margin-page max-w-container-max mx-auto w-full flex flex-col items-center justify-center min-h-[70vh] opacity-0" ref={containerRef}>
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-12 text-center max-w-lg shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">extension</span>
          </div>
          <h2 className="font-heading text-headline-md text-on-surface mb-3">Initialize Customization</h2>
          <p className="font-body-md text-on-surface-variant mb-8">
            Your store currently has no customization framework. Initialize the database to set up your Scent, Vessel, AddOn, and Label configuration steps.
          </p>
          <button
            onClick={() => initCustomization()}
            disabled={isInitializing}
            className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-label-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
          >
            {isInitializing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-primary"></div> : <span className="material-symbols-outlined text-[20px]">play_arrow</span>}
            {isInitializing ? 'Initializing...' : 'Run Setup'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="p-gutter md:p-margin-page max-w-container-max mx-auto w-full opacity-0" ref={containerRef}>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Customization Options</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Configure the multi-step journey for your bespoke products.</p>
        </div>
        <button
          onClick={() => navigate(`/options/add?step=${activeTab}`)}
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:bg-primary-container transition-colors whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> Add Option
        </button>
      </div>

      {/* Stepper / Tabs */}
      <div className="mb-stack-lg border-b border-surface-variant">
        <div className="flex overflow-x-auto gap-8 pb-4 hide-scrollbar">
          {steps.map((step) => {
            const isActive = step.stepNumber === activeTab;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveTab(step.stepNumber)}
                className={`relative flex flex-col gap-2 min-w-[120px] group cursor-pointer ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full font-label-sm text-label-sm transition-colors ${isActive ? 'bg-primary text-on-primary' : 'border border-outline text-on-surface-variant group-hover:border-on-surface'}`}>
                    {step.stepNumber}
                  </span>
                  <span className={`font-label-md text-label-md whitespace-nowrap capitalize ${isActive ? 'font-bold' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {isActive && <div className="absolute -bottom-[17px] left-0 w-full h-1 bg-primary rounded-t-full"></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentOptions.map((opt) => (
          <div
            key={opt._id}
            className={`card-animate bg-surface-container-lowest border border-surface-variant rounded-xl p-4 flex flex-col gap-4 shadow-sm relative group transition-opacity duration-300 ${!opt.isActive ? 'opacity-70' : 'opacity-100'}`}
          >
            <button
              onClick={() => deleteOption({ stepNumber: activeTab, optionId: opt._id })}
              className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>

            <div className="w-full aspect-video rounded-lg overflow-hidden bg-surface-container flex-shrink-0 border border-surface-variant shadow-sm relative">
              {opt.image?.url ? (
                <img alt={opt.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!opt.isActive ? 'grayscale opacity-70' : ''}`} src={opt.image.url} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">image</span></div>
              )}
              {!opt.isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white drop-shadow-md">visibility_off</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading text-lg font-bold text-on-surface">{opt.name}</h3>
                {/* 👉 UPDATED TOGGLE CALL: Now passing step (activeTab) and optionId */}
                <button
                  onClick={() => toggleStatus({ step: activeTab, optionId: opt._id })}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 cursor-pointer flex-shrink-0 ${opt.isActive ? 'bg-[#c27823]' : 'bg-surface-dim'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-transform duration-300 shadow-sm ${opt.isActive ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-4">{opt.desc || "No description provided."}</p>

              <div className="mt-auto pt-3 border-t border-surface-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface-variant">+₹{Number(opt.price).toFixed(2)}</span>
                  <span className="text-xs text-on-surface-variant/70 border-l border-surface-variant pl-2">{opt.stock} in stock</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/options/edit/${opt._id}?step=${activeTab}`)}
                    className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  {opt.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#fcead7] text-[#c27823]">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-surface-variant text-on-surface-variant">Hidden</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dash Add Button */}
        <button
          onClick={() => navigate(`/options/add?step=${activeTab}`)}
          className="bg-transparent border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-surface-container-low transition-all min-h-[300px] group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:bg-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <div className="text-center">
            <span className="font-heading text-lg font-bold text-on-surface block mb-1">Add New {currentStep?.title || 'Option'}</span>
            <span className="text-sm text-on-surface-variant">Create a new customization choice</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Options;