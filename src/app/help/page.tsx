import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    topic: 'Coverage',
    question: 'How do I check if a specific medical procedure is covered?',
    answer:
      'After uploading your policy document, simply ask a question in the text box like, "Is ACL surgery covered?" or "What is the coverage for dental implants?". Our AI will analyze your document and provide a specific answer based on its clauses.',
  },
  {
    topic: 'Claims',
    question: 'What is the process for filing a claim?',
    answer:
      'You can ask, "What are the steps to file a claim?" or "What documents are needed for a claim?". Suvitta will extract the relevant section from your policy to guide you through the process.',
  },
  {
    topic: 'Policy',
    question: 'Can I find the definition of a term like "pre-existing condition"?',
    answer:
      'Yes. Ask "What is a pre-existing condition according to my policy?" and the AI will find and explain the term as defined in your document.',
  },
  {
    topic: 'Eligibility',
    question: 'How can I check the eligibility criteria for my dependents?',
    answer:
      'Upload your insurance policy and ask, "What are the eligibility rules for dependents?" or "Is my 25-year-old child covered?". The system will provide the exact criteria mentioned in your policy.',
  },
  {
    topic: 'General',
    question: 'Is my uploaded data secure?',
    answer:
      'Absolutely. We prioritize your privacy and security. Your documents are processed in-memory and are not stored on our servers after the analysis is complete. All connections are encrypted.',
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Find answers to common questions about using Suvitta.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-lg text-left font-semibold hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
