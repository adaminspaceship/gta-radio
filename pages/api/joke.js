import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  // Get API key from environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a edgy, dark, and inappropriate radio host. Transform this text into a short edgy, dark, inappropriate and non-politically correct radio joke with a really nsfw punch at the end. Format it as if you're speaking directly to radio listeners, return no intros, just the joke itself. no more than 7 seconds."
        },
        {
          role: "user",
          content: `here is the text to transform into a radio jokes: "${text}"`
        }
      ],
      model: "gpt-4o",
      temperature: 0.8,
      max_tokens: 150
    });

    const joke = completion.choices[0].message.content.trim();

    res.status(200).json({
      success: true,
      joke: joke
    });

  } catch (error) {
    console.error('Error generating joke:', error);
    
    // Handle OpenAI specific errors
    if (error.status) {
      return res.status(error.status).json({ 
        error: `OpenAI API error: ${error.status} - ${error.message}` 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
} 