import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Database,
  Smartphone,
  Sparkles,
  Copy,
  Check,
  Send,
  Download,
  FolderGit2,
  FileCode,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  BookOpen,
  Settings2
} from 'lucide-react';

type TabType = 'appscript' | 'python' | 'database' | 'mobile' | 'ai_studio';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('appscript');
  const [copied, setCopied] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Module Apps Script selection
  const [selectedScript, setSelectedScript] = useState('cleanup');

  const scriptsTemplates: Record<string, string> = {
    cleanup: `/**
 * Gmail CleanUp Pro — Moteur d'archivage & purge sélective
 * Version v1.4.0 (Runtime V8)
 */
function lancerNettoyageAutomatique() {
  const query = "category:promotions older_than:60d";
  const threads = GmailApp.search(query, 0, 100);
  console.log(\`📦 \${threads.length} conversations ciblées pour archivage.\`);
  threads.forEach(t => t.moveToArchive());
  console.info("=== [STATUT] Nettoyage terminé avec succès ===");
}`,
    export_titres: `/**
 * Export Titres & Métadonnées Gmail vers Google Sheets
 * Version v20.3.0 (Smart Batching & Anti-Timeout)
 */
function exportTitresEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("Export_Emails_Gmail");
  const sheet = ss.getActiveSheet();
  const threads = GmailApp.getInboxThreads(0, 50);
  const rows = [];
  threads.forEach(t => {
    t.getMessages().forEach(m => {
      rows.push([m.getDate(), m.getFrom(), m.getSubject(), m.getId()]);
    });
  });
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
  }
  console.info(\`✅ \${rows.length} emails indexés dans Sheets.\`);
}`,
    rules_manager: `/**
 * Gmail Rules Manager — Analyseur et exportateur de filtres
 * Runtime V8 (Moindre privilège)
 */
function analyserReglesGmail() {
  const filters = Gmail.Users.Settings.Filters.list("me").filter || [];
  console.log(\`🔍 \${filters.length} filtres actifs détectés.\`);
  return filters.map(f => ({
    id: f.id,
    criteria: f.criteria,
    action: f.action
  }));
}`,
    drive_scanner: `/**
 * Drive Scanner Enterprise — Audit d'arborescence et GreenIT
 * Changes API & Purge révisions > 90 jours
 */
function auditDriveGreenIT() {
  const files = DriveApp.searchFiles("trashed = false");
  let totalSize = 0;
  let count = 0;
  while (files.hasNext() && count < 200) {
    const f = files.next();
    totalSize += f.getSize();
    count++;
  }
  console.info(\`📊 \${count} fichiers analysés (\${(totalSize / (1024 * 1024)).toFixed(2)} Mo)\`);
}`
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      if (activeTab === 'python') {
        setGeneratedOutput(`# Script Python généré pour : ${promptInput}
import os
import sys
import json
from datetime import datetime

def main():
    print(f"[{datetime.now().isoformat()}] Exécution du script...")
    # Logique de traitement optimisée standard library
    data = {"status": "success", "task": "${promptInput}"}
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    main()`);
      } else if (activeTab === 'database') {
        setGeneratedOutput(`-- Schéma SQL Cloudflare D1 / SQLite pour : ${promptInput}
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
-- Requête optimisée
SELECT id, name, category, created_at FROM items ORDER BY created_at DESC LIMIT 50;`);
      } else if (activeTab === 'mobile') {
        setGeneratedOutput(`// Composant Compose Multiplatform pour : ${promptInput}
package fr.interdev.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun GeneratedScreen(modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth().padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "${promptInput}",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { /* Action */ }) {
                Text("Exécuter")
            }
        }
    }
}`);
      } else {
        setGeneratedOutput(`// Snippet Google Apps Script généré pour : ${promptInput}
function executerTachePersonnalisee() {
  const user = Session.getActiveUser().getEmail();
  console.log(\`Exécution lancée par \${user} pour : ${promptInput}\`);
  // Logique métier
}`);
      }
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Interdevappscript
            </h1>
            <p className="text-xs text-slate-400">
              Universal Google AI Studio & Multi-Ecosystem Development Workbench
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Google AI Studio Ready
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            React 19 • Vite 6 • Tailwind v4
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 space-y-2 flex flex-col">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
            Environnements Dev
          </div>

          <button
            onClick={() => setActiveTab('appscript')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'appscript'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Apps Script Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'python'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Python & Automation</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>SQL & Cloudflare D1</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'mobile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Mobile & KMP Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_studio')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'ai_studio'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Google AI Studio Direct</span>
          </button>

          <div className="pt-4 mt-auto border-t border-slate-800/80 text-xs text-slate-500 space-y-1 px-2">
            <p className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sécurité : Zéro fuite de clé
            </p>
            <p>Monorepo : Geoff1805</p>
          </div>
        </nav>

        {/* Content Workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === 'appscript' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Google Apps Script Workbench
                  </h2>
                  <p className="text-sm text-slate-400">
                    Console de gestion, génération et prévisualisation pour vos scripts Google Workspace.
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cleanup">CleanUp Pro (Archivage)</option>
                    <option value="export_titres">Export Titres Emails</option>
                    <option value="rules_manager">Rules & Filters Manager</option>
                    <option value="drive_scanner">Drive Scanner GreenIT</option>
                  </select>
                </div>
              </div>

              {/* Code Viewer Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span>{selectedScript.toUpperCase()}.gs</span>
                  </div>
                  <button
                    onClick={() => handleCopy(scriptsTemplates[selectedScript])}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition border border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier le code'}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed bg-slate-950/70">
                  {scriptsTemplates[selectedScript]}
                </pre>
              </div>
            </div>
          )}

          {activeTab !== 'appscript' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {activeTab === 'python' && <Terminal className="w-5 h-5 text-emerald-400" />}
                  {activeTab === 'database' && <Database className="w-5 h-5 text-sky-400" />}
                  {activeTab === 'mobile' && <Smartphone className="w-5 h-5 text-purple-400" />}
                  {activeTab === 'ai_studio' && <Sparkles className="w-5 h-5 text-pink-400" />}
                  <span>
                    {activeTab === 'python' && 'Atelier Python & Automatisation Locale'}
                    {activeTab === 'database' && 'Générateur SQL & Base Cloudflare D1'}
                    {activeTab === 'mobile' && 'Laboratoire Mobile Kotlin Multiplatform'}
                    {activeTab === 'ai_studio' && 'Bac à sable Google AI Studio (Gemini GenAI)'}
                  </span>
                </h2>
                <p className="text-sm text-slate-400">
                  Définissez votre besoin ou instruction pour générer le code prêt à l'emploi.
                </p>
              </div>

              {/* Input prompt */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={
                      activeTab === 'python'
                        ? "Ex: Parser un fichier CSV de comptes et générer un rapport JSON..."
                        : activeTab === 'database'
                        ? "Ex: Créer une table de tomes de BD avec statut de lecture et trigger de mise à jour..."
                        : activeTab === 'mobile'
                        ? "Ex: Composant Compose pour afficher une carte de besoin avec badge de priorité..."
                        : "Ex: Écris un prompt optimisé pour résumer un journal d'erreurs en 3 points..."
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !promptInput.trim()}
                    className="absolute right-3 bottom-3 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition"
                  >
                    {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isGenerating ? 'Génération...' : 'Générer avec l\'IA'}</span>
                  </button>
                </div>
              </div>

              {/* Output Panel */}
              {generatedOutput && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0">
                  <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Résultat généré</span>
                    <button
                      onClick={() => handleCopy(generatedOutput)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed bg-slate-950/70">
                    {generatedOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
