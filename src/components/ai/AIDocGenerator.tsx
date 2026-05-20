'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Loader2, FileText, Building2, Copy, User, MapPin, Calendar } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';

const departments = [
  'General', 'DRDA', 'Social Audit', 'Nagar Palika',
  'Panchayat', 'Block Office', 'Tehsil', 'IGRS', 'Rural Development',
];

const letterTypes = [
  { value: 'complaint', label: 'शिकायत निस्तारण' },
  { value: 'report', label: 'आख्या प्रेषण' },
  { value: 'order', label: 'कार्यालय आदेश' },
  { value: 'letter', label: 'सामान्य पत्र' },
  { value: 'notice', label: 'नोटिस/सूचना' },
  { value: 'memo', label: 'ज्ञापन' },
  { value: 'reply', label: 'IGRS उत्तर' },
  { value: 'reminder', label: 'स्मरण पत्र' },
];

export default function AIDocGenerator() {
  const [department, setDepartment] = useState('General');
  const [letterType, setLetterType] = useState('letter');
  const [topic, setTopic] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [district, setDistrict] = useState('बागपत');
  const [date, setDate] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { aiModel } = useSettingsStore();
  const { updateContent } = useDocumentStore();
  const { setSidebarPanel } = useUIStore();

  useEffect(() => {
    if (letterType === 'complaint') {
      setTopic('आई०जी०आर०एस० पोर्टल पर प्राप्त शिकायत संख्या ________ दिनांक ________ का निस्तारण किये जाने के सम्बन्ध में।');
      setDepartment('DRDA');
      setSender('परियोजना निदेशक');
      setRecipient('जिलाधिकारी');
    } else if (letterType === 'report') {
      setTopic('सामाजिक अंकेक्षण में चिन्हित बिन्दुओं पर कार्यवाही रिपोर्ट (ATR) के सम्बन्ध में।');
      setDepartment('Social Audit');
    } else if (!topic) {
      setTopic('');
    }
  }, [letterType]);

  const generateDocument = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedText('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, department, letterType, additionalContext, sender, recipient, district, date, model: aiModel }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setGeneratedText(`❌ Error (${res.status}): ${errData.error}\n${errData.details || ''}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setGeneratedText('❌ Response body empty — कृपया पेज refresh करें।');
        return;
      }
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            result += JSON.parse(data).text;
            setGeneratedText(result);
          } catch { /* skip */ }
        }
      }
      if (!result) {
        setGeneratedText('⚠️ AI ने खाली response दिया। कृपया दोबारा कोशिश करें।');
      }
    } catch (err) {
      setGeneratedText(`❌ Groq API से कनेक्ट नहीं हो पा रहा।\n\nकृपया सुनिश्चित करें कि API key सही है।\n\nError: ${String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const insertIntoEditor = () => {
    updateContent(generatedText);
    setSidebarPanel('editor');
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI दस्तावेज़ जनरेटर</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Document Generator</p>
            </div>
          </div>
        </motion.div>

        <div className="glass-card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              विषय (Topic) *
            </label>
            <input
              className="input-field"
              placeholder="उदा: IGRS शिकायत का निस्तारण..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Building2 className="w-3.5 h-3.5 inline mr-1" />विभाग (Department)
              </label>
              <select className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <FileText className="w-3.5 h-3.5 inline mr-1" />पत्र प्रकार (Type)
              </label>
              <select className="input-field" value={letterType} onChange={(e) => setLetterType(e.target.value)}>
                {letterTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <User className="w-3.5 h-3.5 inline mr-1" />प्रेषक (Sender)
              </label>
              <input
                className="input-field"
                list="sender-options"
                placeholder="उदा: परियोजना निदेशक"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              />
              <datalist id="sender-options">
                <option value="परियोजना निदेशक" />
                <option value="जिला विकास अधिकारी" />
                <option value="मुख्य विकास अधिकारी" />
                <option value="जिलाधिकारी" />
                <option value="खण्ड विकास अधिकारी" />
                <option value="उप जिलाधिकारी" />
                <option value="तहसीलदार" />
                <option value="ग्राम प्रधान" />
                <option value="सचिव" />
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <User className="w-3.5 h-3.5 inline mr-1" />सेवा में (Recipient)
              </label>
              <input
                className="input-field"
                list="recipient-options"
                placeholder="उदा: जिलाधिकारी"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <datalist id="recipient-options">
                <option value="जिलाधिकारी" />
                <option value="मुख्य विकास अधिकारी" />
                <option value="परियोजना निदेशक" />
                <option value="जिला विकास अधिकारी" />
                <option value="खण्ड विकास अधिकारी" />
                <option value="उप जिलाधिकारी" />
                <option value="निदेशक, सामाजिक अंकेक्षण" />
                <option value="आयुक्त ग्राम्य विकास" />
                <option value="ग्राम प्रधान" />
                <option value="सचिव" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-3.5 h-3.5 inline mr-1" />जनपद (District)
              </label>
              <select className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="बागपत">बागपत</option>
                <option value="लखनऊ">लखनऊ</option>
                <option value="मेरठ">मेरठ</option>
                <option value="गाज़ियाबाद">गाज़ियाबाद</option>
                <option value="शामली">शामली</option>
                <option value="मुजफ्फरनगर">मुजफ्फरनगर</option>
                <option value="सहारनपुर">सहारनपुर</option>
                <option value="गौतम बुद्ध नगर">गौतम बुद्ध नगर</option>
                <option value="हापुड़">हापुड़</option>
                <option value="बुलंदशहर">बुलंदशहर</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-3.5 h-3.5 inline mr-1" />दिनांक (Date)
              </label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              अतिरिक्त जानकारी (Optional Context)
            </label>
            <textarea
              className="input-field min-h-[60px] resize-none"
              placeholder="कोई अतिरिक्त विवरण..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
          </div>

          <button
            className="btn-primary w-full justify-center"
            onClick={generateDocument}
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />जनरेट हो रहा है...</>
            ) : (
              <><Send className="w-4 h-4" />दस्तावेज़ जनरेट करें</>
            )}
          </button>
        </div>

        {/* Generated Output */}
        {generatedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">जनरेट किया गया दस्तावेज़</h3>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs" onClick={() => navigator.clipboard.writeText(generatedText)}>
                  <Copy className="w-3.5 h-3.5 inline mr-1" />कॉपी
                </button>
                <button className="btn-primary text-xs" onClick={insertIntoEditor}>
                  संपादक में डालें
                </button>
              </div>
            </div>
            <div
              className="p-4 rounded-lg text-sm leading-relaxed"
              style={{ background: 'var(--bg-tertiary)', fontFamily: 'var(--font-hindi)', whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: generatedText }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
