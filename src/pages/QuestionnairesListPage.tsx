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
import { Trash2, Loader2, FileText, BookOpen, ClipboardList } from 'lucide-react';
import {
  fetchQuestionnaires,
  deleteQuestionnaire,
  QuestionnaireResponse,
} from '@/services/api';

const QuestionnairesListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([]);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<QuestionnaireResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchQuestionnaires();
      setQuestionnaires(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteClick = (questionnaire: QuestionnaireResponse) => {
    setDeleteTarget(questionnaire);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestionnaire(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete questionnaire');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'flashcard':
        return <BookOpen className="h-4 w-4" />;
      case 'test':
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (questionnaire: QuestionnaireResponse) => {
    const type = questionnaire.questionnaireType || questionnaire.type || 'question';
    const variant = type === 'flashcard' ? 'secondary' : type === 'test' ? 'default' : 'outline';
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getTypeIcon(type)}
        <span className="capitalize">{type}</span>
      </Badge>
    );
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground">Questionnaires</h2>
      <p className="text-sm text-muted-foreground">
        View and manage all questionnaires, flashcards, and tests
      </p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">All Questionnaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading questionnaires...</span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {error}
              <Button variant="link" className="ml-2 p-0 h-auto" onClick={loadData}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && questionnaires.length === 0 && (
            <p className="text-muted-foreground py-4 text-center">No questionnaires yet.</p>
          )}

          {!loading && !error && questionnaires.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionnaires.map((questionnaire) => (
                  <TableRow key={questionnaire.id}>
                    <TableCell className="font-mono text-sm">
                      {questionnaire.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{questionnaire.title}</p>
                        {questionnaire.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {questionnaire.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(questionnaire)}</TableCell>
                    <TableCell>{questionnaire.questions?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(questionnaire)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Questionnaire?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the questionnaire{' '}
              <strong>"{deleteTarget?.title}"</strong> (ID: {deleteTarget?.id}).
              This action cannot be undone.
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

export default QuestionnairesListPage;
