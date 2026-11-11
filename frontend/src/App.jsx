import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Group from './pages/Group';
import NewCase from './pages/NewCase';
import SettleUp from './pages/SettleUp';
import CaseDetail from './pages/CaseDetail';
import HallOfShame from './pages/HallOfShame';
import { api } from './api';

export default function App() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('court_lang') || 'en';
  });

  const [court, setCourt] = useState(() => {
    const saved = localStorage.getItem('court_group');
    return saved ? JSON.parse(saved) : null;
  });

  const [member, setMember] = useState(() => {
    const saved = localStorage.getItem('court_member');
    return saved ? JSON.parse(saved) : null;
  });

  // Current view: 'home' | 'group' | 'new-case' | 'settle' | 'case-detail' | 'shame'
  const [view, setView] = useState(() => (court ? 'group' : 'home'));
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [membersList, setMembersList] = useState([]);

  useEffect(() => {
    localStorage.setItem('court_lang', language);
  }, [language]);

  useEffect(() => {
    if (court) {
      localStorage.setItem('court_group', JSON.stringify(court));
      // Refresh court members
      api.getGroup(court.code)
        .then((data) => {
          if (data?.members) setMembersList(data.members);
        })
        .catch(() => {});
    } else {
      localStorage.removeItem('court_group');
    }
  }, [court]);

  useEffect(() => {
    if (member) {
      localStorage.setItem('court_member', JSON.stringify(member));
    } else {
      localStorage.removeItem('court_member');
    }
  }, [member]);

  const handleJoinSuccess = (joinedGroup, joinedMember) => {
    setCourt(joinedGroup);
    setMember(joinedMember);
    setView('group');
  };

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setView('case-detail');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f5ee] text-[#1b263b]">
      <Navbar
        currentCourt={court}
        currentMember={member}
        language={language}
        setLanguage={setLanguage}
        onNavigate={(target) => {
          if (target === 'home') {
            setCourt(null);
            setMember(null);
            setView('home');
          } else {
            setView(target);
          }
        }}
      />

      <main className="flex-1 pb-12">
        {view === 'home' || !court ? (
          <Home
            language={language}
            onJoinSuccess={handleJoinSuccess}
          />
        ) : view === 'group' ? (
          <Group
            group={court}
            currentMember={member}
            language={language}
            onNavigate={setView}
            onSelectExpense={handleSelectExpense}
          />
        ) : view === 'new-case' ? (
          <NewCase
            group={court}
            members={membersList.length > 0 ? membersList : [member]}
            currentMember={member}
            language={language}
            onExpenseSaved={() => setView('group')}
            onCancel={() => setView('group')}
          />
        ) : view === 'settle' ? (
          <SettleUp
            group={court}
            currentMember={member}
            language={language}
            onBack={() => setView('group')}
          />
        ) : view === 'case-detail' ? (
          <CaseDetail
            expenseId={selectedExpenseId}
            currentMember={member}
            language={language}
            onBack={() => setView('group')}
          />
        ) : view === 'shame' ? (
          <HallOfShame
            group={court}
            currentMember={member}
            language={language}
            onBack={() => setView('group')}
          />
        ) : null}
      </main>

      <footer className="py-4 border-t border-[#e2d9c8] text-center text-xs text-gray-500 font-serif">
        Group Expense Court ⚖️ · Ethiopian Birr (ETB) · Pure Integer Cents · Serverless Postgres
      </footer>
    </div>
  );
}

