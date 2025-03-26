import fetch from 'node-fetch';

async function testWebhook() {
  try {
    const response = await fetch('http://localhost:5001/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          type: 'end-of-call-report',
          transcript: `
            Assistant: Hello! How can I help you today?
            User: I'm interested in learning more about your services.
            Assistant: I'd be happy to tell you about our services. We offer...
            User: That sounds great. What are your pricing options?
            Assistant: Our pricing is flexible and depends on your needs...
          `,
        },
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWebhook(); 