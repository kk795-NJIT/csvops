import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import LandingPage from './components/LandingPage'
import WaitlistModal from './components/WaitlistModal'
import CSVImporter from './components/CSVImporter'
import ConciergePage from './components/ConciergePage'
import MVPPage from './components/MVPPage'
import FreeToolPage from './components/FreeToolPage'
import { TemplatePage, TemplatesIndex } from './components/TemplatePage'
import LoginPage from './components/LoginPage'
import RunHistoryPage from './components/RunHistoryPage'
import { ImportTemplate } from './data/templates'

// Wrapper components for route-based navigation
function LandingPageWrapper() {
    const navigate = useNavigate()
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)

    return (
        <>
            <LandingPage
                onOpenWaitlist={() => setIsWaitlistOpen(true)}
                onTryNow={() => navigate('/tool')}
                onConcierge={() => navigate('/concierge')}
                onTemplates={() => navigate('/templates')}
                onFullApp={() => navigate('/app/import')}
            />
            <WaitlistModal
                isOpen={isWaitlistOpen}
                onClose={() => setIsWaitlistOpen(false)}
            />
        </>
    )
}

function MVPWrapper() {
    const navigate = useNavigate()
    return <MVPPage onBack={() => navigate('/')} />
}

function ImporterWrapper() {
    const navigate = useNavigate()
    return <CSVImporter onBack={() => navigate('/')} />
}

function ConciergeWrapper() {
    const navigate = useNavigate()
    return <ConciergePage onBack={() => navigate('/')} />
}

// Enhanced FreeToolPage that reads template from route state
function FreeToolWithTemplateState() {
    const navigate = useNavigate()
    const [template] = useState<ImportTemplate | null>(() => {
        // Check if there's a template in location state
        const state = window.history.state?.usr
        if (state?.template) {
            return state.template as ImportTemplate
        }
        return null
    })

    return (
        <FreeToolPage
            onBack={() => navigate('/')}
            onViewTemplates={() => navigate('/templates')}
            initialTemplate={template}
        />
    )
}

function App() {
    return (
        <HelmetProvider>
            <div className="min-h-screen bg-gray-950">
                <Routes>
                    <Route path="/" element={<LandingPageWrapper />} />
                    <Route path="/tool" element={<FreeToolWithTemplateState />} />
                    <Route path="/templates" element={<TemplatesIndex />} />
                    <Route path="/templates/:slug" element={<TemplatePage />} />
                    <Route path="/app/import" element={<MVPWrapper />} />
                    <Route path="/importer" element={<ImporterWrapper />} />
                    <Route path="/concierge" element={<ConciergeWrapper />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/history" element={<RunHistoryPage />} />
                </Routes>
            </div>
        </HelmetProvider>
    )
}

export default App
