#Suvitta


curl -X POST "https://api-8qxf1yhxg-nomadsvvits-projects.vercel.app/api/hackrx/run" \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-H "Authorization: Bearer hackrx-test-token-2025" \
-d '{
    "documents": "https://hackrx.blob.core.windows.net/assets/policy.pdf?sv=2023-01-03&st=2025-07-04T09%3A11%3A24Z&se=2027-07-05T09%3A11%3A00Z&sr=b&sp=r&sig=N4a9OU0w0QXO6AOIBiu4bpl7AXvEZogeT%2FjUHNO7HzQ%3D",
    "questions": [
        "What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?",
        "What is the waiting period for pre-existing diseases (PED) to be covered?",
        "Does this policy cover maternity expenses, and what are the conditions?",
        "What is the waiting period for cataract surgery?",
        "Are the medical expenses for an organ donor covered under this policy?",
        "What is the No Claim Discount (NCD) offered in this policy?",
        "Is there a benefit for preventive health check-ups?",
        "How does the policy define a 'Hospital'?",
        "What is the extent of coverage for AYUSH treatments?",
        "Are there any sub-limits on room rent and ICU charges for Plan A?"
    ]

## Deployment on Vercel

This project is configured for Vercel deployment as a Next.js application.

### Environment Variables

Ensure the following environment variables are set in your Vercel project dashboard:

- `GOOGLE_GENAI_API_KEY`: Your Google Gemini API Key (for Genkit AI features).
- `HACKRX_TOKEN`: Security token for the public API (default: `hackrx-test-token-2025`).
- `HACKRX_TEAM_TOKEN`: Your internal team token for the webhook proxy.
- `BACKEND_URL`: (Optional) The base URL if you're using a separate backend for the webhook.

### Steps to Deploy

1.  Push your code to a GitHub/GitLab/Bitbucket repository.
2.  Import the project into Vercel.
3.  Vercel will automatically detect Next.js.
4.  Add the environment variables listed above.
5.  Click **Deploy**.

## Features

- **Document Analysis**: Upload financial documents and ask questions.
- **AI-Powered**: Uses Genkit and Gemini 2.0 Flash for accurate extraction and reasoning.
- **Voice Support**: Hands-free interaction with speech-to-text.
- **Vercel Ready**: Optimized for serverless deployment.
