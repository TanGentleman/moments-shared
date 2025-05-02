import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import ReactMarkdown from 'react-markdown';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { CheckCircle, XCircle, Clock, Tag, Plus, X } from 'lucide-react';
import { formatDate } from '../utils/dashboard';

const markdownStyles = `
.markdown-content { color: #222; font-size: 1rem; }
.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6 { color: #1e293b; font-weight: 700; }
.markdown-content p, .markdown-content li, .markdown-content ul, .markdown-content ol { color: #222; }
.markdown-content code { background: #f3f4f6; color: #be185d; border-radius: 0.25rem; padding: 0.15em 0.3em; font-size: 0.95em; }
.markdown-content pre { background: #1e293b; color: #f1f5f9; border-radius: 0.375rem; padding: 1em; overflow-x: auto; }
.markdown-content blockquote { border-left: 4px solid #a78bfa; background: #f8fafc; color: #334155; padding: 0.5em 1em; margin: 0.5em 0; }
.markdown-content a { color: #6366f1; text-decoration: underline; }
.markdown-content strong { color: #0f172a; }
.markdown-content em { color: #334155; }
`;

type ApprovalStatus = "pending" | "approved" | "rejected";
const TIMEZONE = import.meta.env.VITE_TIMEZONE || "UTC";

function StatusBadge({ status }: { status?: ApprovalStatus }) {
  const statusMap = {
    approved: { color: "bg-green-500 hover:bg-green-600", icon: <CheckCircle className="w-4 h-4 mr-1" />, label: "Approved" },
    rejected: { color: "bg-red-500 hover:bg-red-600", icon: <XCircle className="w-4 h-4 mr-1" />, label: "Rejected" },
    pending:  { color: "bg-yellow-500 hover:bg-yellow-600", icon: <Clock className="w-4 h-4 mr-1" />, label: "Pending" }
  };
  const { color, icon, label } = statusMap[status ?? "pending"];
  return <Badge className={color}>{icon} {label}</Badge>;
}

function TagBadge({ name, color, onRemove }: { name: string; color?: string; onRemove?: () => void }) {
  return (
    <Badge className="mr-2 mb-2" style={{ backgroundColor: color || '#6366F1', color: 'white' }}>
      <Tag className="w-3 h-3 mr-1" />
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:text-gray-200">
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
}

export function ApprovalWorkflow() {
  const [selectedLifelogId, setSelectedLifelogId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [commentInput, setCommentInput] = useState('');

  const pendingLifelogs = useQuery(api.queries.getPendingApprovals);
  const selectedLifelog = useQuery(
    api.queries.getLifelogComplete,
    selectedLifelogId ? { lifelogId: selectedLifelogId } : 'skip'
  );
  const allTags = useQuery(api.queries.listTags);

  const approveLifelog = useMutation(api.mutations.approveLifelog);
  const rejectLifelog = useMutation(api.mutations.rejectLifelog);
  const addTag = useMutation(api.mutations.addTagToLifelog);
  const removeTag = useMutation(api.mutations.removeTagFromLifelog);
  const createTag = useMutation(api.mutations.createTag);

  const handleApprove = async () => {
    if (!selectedLifelogId) return;
    await approveLifelog({ lifelogId: selectedLifelogId, comments: commentInput });
    setCommentInput('');
  };

  const handleReject = async () => {
    if (!selectedLifelogId) return;
    await rejectLifelog({ lifelogId: selectedLifelogId, comments: commentInput });
    setCommentInput('');
  };

  const handleAddTag = async () => {
    const tagName = tagInput.trim();
    if (!selectedLifelogId || !tagName) return;
    const existingTag = allTags?.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    let tagId: Id<"tags"> | undefined = existingTag?._id as Id<"tags"> | undefined;
    if (!tagId) {
      tagId = await createTag({
        name: tagName,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
      });
    }
    if (tagId) {
      await addTag({ lifelogId: selectedLifelogId, tagId });
    }
    setTagInput('');
  };

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    if (!selectedLifelogId) return;
    await removeTag({ lifelogId: selectedLifelogId, tagId });
  };

  if (!pendingLifelogs) {
    return <div className="p-4">Loading approval queue...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <style>{markdownStyles}</style>
      <h1 className="text-2xl font-bold mb-6">Lifelog Approval Workflow</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lifelog List Panel */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Pending Approval ({pendingLifelogs.length})
          </h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {pendingLifelogs.length === 0 ? (
              <p className="text-gray-500 italic">No lifelogs pending approval</p>
            ) : (
              pendingLifelogs.map(lifelog => (
                <Card
                  key={lifelog.lifelogId}
                  className={`cursor-pointer transition-colors hover:bg-gray-100 ${
                    selectedLifelogId === lifelog.lifelogId ? 'border-purple-500 border-2' : ''
                  }`}
                  onClick={() => setSelectedLifelogId(lifelog.lifelogId)}
                >
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium truncate">{lifelog.title}</CardTitle>
                    <div className="text-xs text-gray-500">
                      {formatDate(lifelog.startTime, TIMEZONE)}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
        {/* Lifelog Content Panel */}
        <div className="md:col-span-2">
          {selectedLifelog ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedLifelog.title}</CardTitle>
                  <StatusBadge status={selectedLifelog.approval?.status} />
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(selectedLifelog.startTime, TIMEZONE)}
                </div>
              </CardHeader>
              <CardContent>
                {/* Tags section */}
                <div className="mb-4">
                  <div className="flex flex-wrap mb-2">
                    {selectedLifelog.tags.map(tag => (
                      <TagBadge
                        key={tag._id}
                        name={tag.name}
                        color={tag.color}
                        onRemove={() => handleRemoveTag(tag._id as Id<"tags">)}
                      />
                    ))}
                  </div>
                  <div className="flex">
                    <Input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      placeholder="Add a new tag..."
                      className="mr-2"
                    />
                    <Button
                      onClick={handleAddTag}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                {/* Markdown content */}
                <div className="prose max-w-none border rounded-md p-4 bg-white max-h-[50vh] overflow-y-auto markdown-content">
                  {selectedLifelog.markdown
                    ? <ReactMarkdown>{selectedLifelog.markdown}</ReactMarkdown>
                    : <p className="text-slate-600 italic">No content available</p>
                  }
                </div>
                {/* Comments field */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <Input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="Add comments on approval or rejection..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button onClick={handleReject} variant="destructive">
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button onClick={handleApprove} variant="default">
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Select a lifelog to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}