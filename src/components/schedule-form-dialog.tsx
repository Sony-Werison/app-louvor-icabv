'use client';

import type { Member, Schedule } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ScheduleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Schedule, 'id' | 'playlist' | 'team'> & { id?: string }) => void;
  schedule: Schedule | null;
  members: Member[];
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome da reunião é obrigatório.' }),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  leaderId: z.string({ required_error: 'Selecione um dirigente.' }),
});

export function ScheduleFormDialog({ isOpen, onOpenChange, onSave, schedule, members }: ScheduleFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: schedule?.name || '',
      date: schedule?.date || new Date(),
      leaderId: schedule?.leaderId || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (schedule) {
      onSave({ ...values, id: schedule.id });
    } else {
      onSave(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{schedule ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle>
          <DialogDescription>
            {schedule ? 'Edite as informações da reunião.' : 'Preencha os dados para criar uma nova reunião.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Reunião</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Culto de Domingo - Manhã" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data e Hora</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm")
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                        <Input
                            type="time"
                            defaultValue={format(field.value || new Date(), 'HH:mm')}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = new Date(field.value);
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }}
                        />
                       </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirigente</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dirigente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
