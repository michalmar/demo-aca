import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Loader2 } from 'lucide-react';
import {
  fetchResponses,
  deleteResponse,
  StoredAnswerResponse,
  PaginatedResponsesResult,
} from '@/services/api';

const PAGE_SIZE = 10;

const ResponsesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponsesResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail dialog state
  const [selectedResponse, setSelectedResponse] = useState<StoredAnswerResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<StoredAnswerResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchResponses(page, PAGE_SIZE);
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const handleViewDetail = (response: StoredAnswerResponse) => {
    setSelectedResponse(response);
    setDetailOpen(true);
  };

  const handleDeleteClick = (response: StoredAnswerResponse) => {
    setDeleteTarget(response);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResponse(deleteTarget.questionnaireId, deleteTarget.userId);
      setDeleteOpen(false);
      setDeleteTarget(null);
      // Reload current page, or go to previous page if this was the last item
      const newPage = data && data.items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await loadData(newPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete response');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || (data && page > data.totalPages)) return;
    loadData(page);
  };

  // Calculate score from answers
  const calculateScore = (answers: Record<string, { correct?: string }>) => {
    const entries = Object.values(answers);
    const correct = entries.filter((a) => a.correct === 'yes').length;
    const total = entries.length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    if (!data) return null;
    const { totalPages } = data;
    const items: React.ReactNode[] = [];

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground">Responses</h2>
      <p className="text-sm text-muted-foreground">
        View and manage your questionnaire responses
      </p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Historical Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading responses...</span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && data && data.items.length === 0 && (
            <p className="text-muted-foreground py-4 text-center">No responses yet.</p>
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Questionnaire ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((response) => {
                    const score = calculateScore(response.answers);
                    return (
                      <TableRow key={`${response.questionnaireId}:${response.userId}`}>
                        <TableCell className="font-medium">
                          {response.questionnaireId}
                        </TableCell>
                        <TableCell>{response.userId}</TableCell>
                        <TableCell>{score.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={score.percentage >= 70 ? 'default' : score.percentage >= 50 ? 'secondary' : 'destructive'}
                          >
                            {score.correct}/{score.total} ({score.percentage}%)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(response)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(response)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(currentPage * PAGE_SIZE, data.total)} of {data.total} responses
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
            <DialogDescription>
              {selectedResponse && (
                <>
                  Questionnaire: <strong>{selectedResponse.questionnaireId}</strong> | User:{' '}
                  <strong>{selectedResponse.userId}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <>
              <div className="space-y-4">
                {Object.entries(selectedResponse.answers).map(([questionId, answer]) => (
                  <div
                    key={questionId}
                    className={`rounded-lg border p-4 ${
                      answer.correct === 'yes'
                        ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                        : answer.correct === 'no'
                        ? 'border-red-500/50 bg-red-50 dark:bg-red-950/20'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-sm text-muted-foreground">{questionId}</span>
                      {answer.correct && (
                        <Badge variant={answer.correct === 'yes' ? 'default' : 'destructive'}>
                          {answer.correct === 'yes' ? 'Correct' : 'Incorrect'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2">
                      <span className="text-muted-foreground">Answer:</span>{' '}
                      <span className={`font-semibold ${
                        answer.correct === 'yes'
                          ? 'text-green-700 dark:text-green-300'
                          : answer.correct === 'no'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-foreground'
                      }`}>
                        {answer.value}
                      </span>
                    </p>
                    {answer.correct === 'no' && answer.rightAnswer && (
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">Correct answer:</span>{' '}
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {Array.isArray(answer.rightAnswer)
                            ? answer.rightAnswer.join(', ')
                            : answer.rightAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailOpen(false);
                    handleDeleteClick(selectedResponse);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Response
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the response from{' '}
              <strong>{deleteTarget?.userId}</strong> for questionnaire{' '}
              <strong>{deleteTarget?.questionnaireId}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResponsesPage;
