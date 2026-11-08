import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatAssistant } from './components/ChatAssistant';
import { AppGenerator } from './components/AppGenerator';
import { PromptLibrary } from './components/PromptLibrary';
import { SettingsView } from './components/SettingsView';
import { MobileFrame } from './components/MobileFrame';
import { PromptTemplate } from './utils/helpers';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('generator');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatAssistant />;
      case 'generator':
        return <AppGenerator />;
      case 'library':
        return <PromptLibrary onSelectTemplate={handleSelectTemplate} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ChatAssistant />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none md:select-auto">
      <Navbar
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
        activeTab={activeTab}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileView={isMobileView}
          setIsMobileView={setIsMobileView}
        />

        <main className="flex-1 overflow-hidden">
          {isMobileView ? (
            <MobileFrame>
              {renderContent()}
            </MobileFrame>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}
