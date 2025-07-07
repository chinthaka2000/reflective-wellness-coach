import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Message, ChatSettings, SentimentAnalysis } from '../types';
import { getSentimentEmoji } from './helpers';

interface PDFExportData {
  messages: Message[];
  settings: ChatSettings;
  exportedAt: string;
  version: string;
}

// Generate PDF using HTML to canvas for better Unicode support
export const generateWellnessPDF = async (data: PDFExportData): Promise<Blob> => {
  try {
    // Create a temporary HTML element to render the content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.backgroundColor = 'white';
    container.style.color = '#333';
    container.style.fontSize = '14px';
    container.style.lineHeight = '1.6';
    
    // Generate HTML content
    container.innerHTML = generateHTMLContent(data);
    
    document.body.appendChild(container);
    
    // Convert to canvas
    const canvas = await html2canvas(container, {
      width: 800,
      height: container.scrollHeight,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Remove temporary element
    document.body.removeChild(container);
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF with HTML approach:', error);
    throw new Error('Failed to generate PDF report');
  }
};

function generateHTMLContent(data: PDFExportData): string {
  const { messages, settings, exportedAt } = data;
  
  // Calculate stats
  const totalMessages = messages.length;
  const userMessages = messages.filter(m => m.sender === 'user').length;
  const aiMessages = messages.filter(m => m.sender === 'assistant').length;
  
  // Get date range
  const dates = messages.map(m => new Date(m.timestamp));
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Get sentiments
  const sentiments = messages
    .filter(m => m.sentiment && typeof m.sentiment !== 'string')
    .map(m => m.sentiment as SentimentAnalysis);
  
  const sentimentCounts = sentiments.reduce((acc, s) => {
    acc[s.overall_sentiment] = (acc[s.overall_sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 100%;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b9fe8; padding-bottom: 20px;">
        <h1 style="color: #8b9fe8; font-size: 32px; margin: 0 0 10px 0;">Mental Wellness Report</h1>
        <p style="color: #666; font-size: 18px; margin: 0;">Your Journey to Better Mental Health</p>
      </div>
      
      <!-- Summary Section -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #8b9fe8; font-size: 24px; margin-bottom: 15px;">📊 Summary Overview</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 8px;">• Total Conversations: ${totalMessages}</li>
          <li style="margin-bottom: 8px;">• Your Messages: ${userMessages}</li>
          <li style="margin-bottom: 8px;">• AI Responses: ${aiMessages}</li>
          <li style="margin-bottom: 8px;">• Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</li>
          <li style="margin-bottom: 8px;">• Personality Mode: ${settings.personality_mode.replace('_', ' ')}</li>
          <li style="margin-bottom: 8px;">• Language: ${settings.language}</li>
        </ul>
      </div>
      
      <!-- Sentiment Analysis -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #8b9fe8; font-size: 24px; margin-bottom: 15px;">😊 Emotional Analysis</h2>
        ${sentiments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 10px;">Overall Sentiment Distribution:</h3>
            ${Object.entries(sentimentCounts).map(([sentiment, count]) => {
              const emoji = getSentimentEmoji(sentiment);
              const percentage = ((count / sentiments.length) * 100).toFixed(1);
              return `<p style="margin: 5px 0;">${emoji} ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: ${count} (${percentage}%)</p>`;
            }).join('')}
          </div>
        ` : '<p style="color: #999;">No sentiment analysis data available</p>'}
      </div>
      
      <!-- Chat History -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #8b9fe8; font-size: 24px; margin-bottom: 15px;">💬 Conversation History</h2>
        ${generateChatHistoryHTML(messages)}
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
        <p>Generated on ${new Date(exportedAt).toLocaleString()}</p>
        <p>Mental Wellness AI Assistant</p>
      </div>
    </div>
  `;
}

function generateChatHistoryHTML(messages: Message[]): string {
  const chatMessages = messages.filter(m => 
    m.id !== 'welcome' && 
    m.sender !== 'system' &&
    m.content.trim().length > 0
  );
  
  if (chatMessages.length === 0) {
    return '<p style="color: #999;">No conversation history available</p>';
  }
  
  // Group by date
  const messagesByDate: Record<string, Message[]> = {};
  chatMessages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });
  
  return Object.entries(messagesByDate).map(([date, dayMessages]) => `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #8b9fe8; font-size: 16px; margin-bottom: 10px;">${date}</h3>
      ${dayMessages.map(message => {
        const isUser = message.sender === 'user';
        const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const cleanContent = message.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        return `
          <div style="margin-bottom: 15px; padding: 10px; background-color: ${isUser ? '#f8f9fa' : '#f0f4ff'}; border-radius: 8px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
              ${isUser ? 'You' : 'AI Assistant'} • ${timestamp}
            </div>
            <div style="color: #333; line-height: 1.5;">
              ${cleanContent.replace(/\n/g, '<br>')}
            </div>
            ${message.sentiment && typeof message.sentiment !== 'string' && isUser ? `
              <div style="font-size: 11px; color: #8b9fe8; margin-top: 5px;">
                ${getSentimentEmoji((message.sentiment as SentimentAnalysis).overall_sentiment)} ${(message.sentiment as SentimentAnalysis).overall_sentiment}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
} 