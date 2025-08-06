import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const reports = [
  {
    title: 'Health Insurance Policy 2024',
    date: '2024-07-21',
    queries: 5,
    tags: ['Health Insurance', 'Active'],
  },
  {
    title: 'Car Loan Agreement',
    date: '2024-07-20',
    queries: 2,
    tags: ['Car Loan'],
  },
  {
    title: 'Home Insurance Terms',
    date: '2024-07-18',
    queries: 8,
    tags: ['Home Insurance', 'Expired'],
  },
  {
    title: 'Investment Portfolio Statement',
    date: '2024-07-15',
    queries: 12,
    tags: ['Investments'],
  },
];

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">
          My Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Track and manage your previously analyzed documents and queries.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Document Title</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead>Queries</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.title}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell>{report.queries}</TableCell>
                <TableCell className="flex gap-1">
                  {report.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> View Q&A
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
