import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateCycleConfig } from '@/api/adminApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CycleConfigModal({ isOpen, onClose, config }) {
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      cycleYear: new Date().getFullYear(),
      goalSettingStart: '',
      q1Start: '',
      q2Start: '',
      q3Start: '',
      q4Start: '',
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        cycleYear: config.cycleYear,
        goalSettingStart: config.goalSettingStart ? new Date(config.goalSettingStart).toISOString().slice(0, 10) : '',
        q1Start: config.q1Start ? new Date(config.q1Start).toISOString().slice(0, 10) : '',
        q2Start: config.q2Start ? new Date(config.q2Start).toISOString().slice(0, 10) : '',
        q3Start: config.q3Start ? new Date(config.q3Start).toISOString().slice(0, 10) : '',
        q4Start: config.q4Start ? new Date(config.q4Start).toISOString().slice(0, 10) : '',
      });
    }
  }, [config, form]);

  const mutation = useMutation({
    mutationFn: updateCycleConfig,
    onSuccess: () => {
      toast.success('Cycle configured successfully');
      queryClient.invalidateQueries({ queryKey: ['cycleConfig'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to configure cycle');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Cycle Dates</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cycle Year</Label>
            <Input type="number" {...form.register('cycleYear')} />
          </div>
          <div className="space-y-2">
            <Label>Goal Setting Window Start (default: 1st May)</Label>
            <Input type="date" {...form.register('goalSettingStart')} />
          </div>
          <div className="space-y-2">
            <Label>Q1 Check-in Start (default: 1st July)</Label>
            <Input type="date" {...form.register('q1Start')} />
          </div>
          <div className="space-y-2">
            <Label>Q2 Check-in Start (default: 1st October)</Label>
            <Input type="date" {...form.register('q2Start')} />
          </div>
          <div className="space-y-2">
            <Label>Q3 Check-in Start (default: 1st January)</Label>
            <Input type="date" {...form.register('q3Start')} />
          </div>
          <div className="space-y-2">
            <Label>Q4 Check-in Start (default: 1st March)</Label>
            <Input type="date" {...form.register('q4Start')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
