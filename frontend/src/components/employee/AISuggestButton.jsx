import { useState } from'react';
import { useMutation } from'@tanstack/react-query';
import {
 ArrowLeft,
 Lightbulb,
 Loader2,
 Sparkles,
 Target,
} from'lucide-react';
import toast from'react-hot-toast';

import { suggestGoal } from'@/api/aiApi';
import { Badge } from'@/components/ui/badge';
import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { Textarea } from'@/components/ui/textarea';
import { useAuthStore } from'@/store/authStore';

const UOM_LABELS = {
 min:'Higher is Better',
 max:'Lower is Better',
 timeline:'Date-based',
 zero:'Zero = Success',
};

function AISuggestButton({ onAccept }) {
 const user = useAuthStore((state) => state.user);
 const [isOpen, setIsOpen] = useState(false);
 const [step, setStep] = useState(1);
 const [roughIdea, setRoughIdea] = useState('');
 const [thrustArea, setThrustArea] = useState('');
 const [suggestion, setSuggestion] = useState(null);

 const mutation = useMutation({
 mutationFn: (data) => suggestGoal(data),
 onSuccess: (data) => {
 if (data?.suggestion) {
 setSuggestion(data.suggestion);
 setStep(2);
 } else {
 toast.error('AI suggestion unavailable. Please fill the form manually.');
 }
 },
 onError: (error) => {
 const msg =
 error.response?.status === 429
 ?'Rate limit exceeded. Try again later.'
 :'AI suggestion unavailable. Please fill the form manually.';
 toast.error(msg);
 },
 });

 const handleGenerate = () => {
 if (roughIdea.trim().length < 5) {
 toast.error('Please describe your goal idea in at least 5 characters.');
 return;
 }

 mutation.mutate({
 roughIdea: roughIdea.trim(),
 department: user?.department ||'General',
 thrustArea: thrustArea.trim() ||'General',
 });
 };

 const handleAccept = () => {
 if (suggestion) {
 onAccept(suggestion);
 }
 handleClose();
 };

 const handleTryAgain = () => {
 setSuggestion(null);
 setStep(1);
 };

 const handleClose = () => {
 setIsOpen(false);
 setStep(1);
 setRoughIdea('');
 setThrustArea('');
 setSuggestion(null);
 };

 return (
 <>
 <Button
 type="button"
 variant="outline"
 className="gap-1.5 rounded-xl border-purple-200 text-purple-600 hover:border-purple-300 hover:bg-purple-50"
 onClick={() => setIsOpen(true)}
 >
 <Sparkles className="size-4" />
 Suggest with AI
 </Button>

 <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
 <DialogContent onOpenChange={(next) => !next && handleClose()} className="max-w-xl">
 {/* Step 1: Input */}
 {step === 1 && (
 <>
 <DialogHeader>
 <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 text-purple-600">
 <Sparkles className="size-5" />
 </div>
 <DialogTitle>
 <span className="flex items-center gap-2">
 <span>✨</span> AI Goal Suggester
 </span>
 </DialogTitle>
 <DialogDescription>
 Describe your goal idea in simple words and AI will structure it for you.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="roughIdea">Your goal idea</Label>
 <Textarea
 id="roughIdea"
 placeholder="e.g. I want to improve customer response time by training the support team"
 className="min-h-24"
 value={roughIdea}
 onChange={(e) => setRoughIdea(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="aiThrustArea">Thrust Area</Label>
 <Input
 id="aiThrustArea"
 placeholder="e.g. Quality, Revenue, Efficiency"
 value={thrustArea}
 onChange={(e) => setThrustArea(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <Label>Department</Label>
 <Input
 value={user?.department ||'General'}
 readOnly
 className="bg-slate-50 text-gray-500"
 />
 </div>
 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={handleClose}
 >
 Cancel
 </Button>
 <Button
 type="button"
 className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700"
 onClick={handleGenerate}
 disabled={mutation.isPending}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 <span className="animate-pulse">AI is thinking...</span>
 </>
) : (
 <>
 <Sparkles className="size-4" />
 Generate Suggestion
 </>
)}
 </Button>
 </DialogFooter>
 </>
)}

 {/* Step 2: Suggestion Result */}
 {step === 2 && suggestion && (
 <>
 <DialogHeader>
 <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600">
 <Sparkles className="size-5" />
 </div>
 <DialogTitle>
 <span className="flex items-center gap-2">
 <span>✨</span> AI Suggestion Ready
 </span>
 </DialogTitle>
 <DialogDescription>
 Review the suggestion below and accept it to auto-fill your goal form.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4">
 {/* Title */}
 <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
 <h3 className="m-0 text-lg font-bold text-gray-900">
 {suggestion.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-gray-600">
 {suggestion.description}
 </p>
 </div>

 {/* Metrics Row */}
 <div className="grid grid-cols-3 gap-3">
 <div className="rounded-xl border border-slate-200 p-3 text-center">
 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">UoM Type</p>
 <Badge variant="default" className="mt-1.5 bg-blue-50 text-blue-700">
 {UOM_LABELS[suggestion.uomType] || suggestion.uomType}
 </Badge>
 </div>
 <div className="rounded-xl border border-slate-200 p-3 text-center">
 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Target</p>
 <p className="mt-1 text-lg font-bold text-gray-900">
 {suggestion.suggestedTarget ??'—'}
 {suggestion.targetUnit && (
 <span className="ml-1 text-xs font-medium text-gray-500">{suggestion.targetUnit}</span>
)}
 </p>
 </div>
 <div className="rounded-xl border border-slate-200 p-3 text-center">
 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Weightage</p>
 <p className="mt-1 text-lg font-bold text-gray-900">
 {suggestion.weightageSuggestion}%
 </p>
 </div>
 </div>

 {/* UoM Reason */}
 {suggestion.uomReason && (
 <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm italic text-gray-500">
 <Target className="mr-1.5 inline size-3.5 text-gray-500" />
 {suggestion.uomReason}
 </p>
)}

 {/* Tips */}
 {suggestion.tips?.length > 0 && (
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tips for success</p>
 <ul className="space-y-2">
 {suggestion.tips.map((tip, idx) => (
 <li
 key={idx}
 className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2.5 text-sm text-amber-800"
 >
 <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
 {tip}
 </li>
))}
 </ul>
 </div>
)}

 <p className="text-center text-xs text-gray-500">
 You can edit all fields after accepting
 </p>
 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={handleTryAgain}
 >
 <ArrowLeft className="size-4" />
 Try Again
 </Button>
 <Button
 type="button"
 className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
 onClick={handleAccept}
 >
 <Sparkles className="size-4" />
 Use This Goal
 </Button>
 </DialogFooter>
 </>
)}
 </DialogContent>
 </Dialog>
 </>
);
}

export default AISuggestButton;
