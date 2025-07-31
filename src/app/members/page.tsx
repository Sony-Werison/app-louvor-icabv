import { members } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, User } from 'lucide-react';

export default function MembersPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Membros</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-xl">{member.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{member.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${member.email}`} className="hover:text-foreground transition-colors">
                  {member.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${member.phone}`} className="hover:text-foreground transition-colors">
                  {member.phone}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
