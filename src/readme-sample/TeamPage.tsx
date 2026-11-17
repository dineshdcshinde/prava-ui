"use client"; // Needed by Next.js. Vite ignores it, so one file works in both.

import { useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  Dialog,
  DialogClose,
  DropdownMenu,
  Grid,
  Input,
  Progress,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  dismissToast,
  toast,
} from "../index";

type Member = { name: string; email: string; role: string };

const SEATS = 8;
const roles = [
  { value: "Admin", label: "Admin", description: "Manages billing and people" },
  {
    value: "Editor",
    label: "Editor",
    description: "Creates and edits projects",
  },
  { value: "Viewer", label: "Viewer", description: "Views and comments" },
];
const roleTone = {
  Admin: "primary",
  Editor: "info",
  Viewer: "neutral",
} as const;
const muted = { margin: 0, color: "var(--prava-color-text-muted)" };

export function TeamPage() {
  const [members, setMembers] = useState<Member[]>([
    { name: "Aisha Khan", email: "aisha@acme.dev", role: "Admin" },
    { name: "Mateo Rossi", email: "mateo@acme.dev", role: "Editor" },
    { name: "Mei Tanaka", email: "mei@acme.dev", role: "Viewer" },
  ]);
  const [invites, setInvites] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const seatsUsed = members.length + invites.length;

  function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    setInvites((list) => [...list, email]);
    setInviting(false);
    event.currentTarget.reset();
    toast({ title: "Invite sent", description: email, tone: "success" });
  }

  function setRole(member: Member, role: string) {
    setMembers((list) => list.map((m) => (m === member ? { ...m, role } : m)));
  }

  function remove(member: Member) {
    setMembers((list) => list.filter((m) => m !== member));
    const id = toast({
      title: `${member.name} was removed`,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setMembers((list) => [...list, member]);
            dismissToast(id);
          }}
        >
          Undo
        </Button>
      ),
    });
  }

  return (
    <Container size="lg">
      <Stack gap={6}>
        <Stack
          orientation="horizontal"
          justify="between"
          align="center"
          gap={4}
          wrap
        >
          <div>
            <h1 style={{ margin: 0 }}>Team</h1>
            <p style={muted}>Choose who can see and edit your workspace.</p>
          </div>
          <Button
            onClick={() => setInviting(true)}
            disabled={seatsUsed >= SEATS}
          >
            Invite people
          </Button>
        </Stack>

        <Progress label="Seats used" value={seatsUsed} max={SEATS} showValue />

        <Tabs defaultValue="members">
          <TabList aria-label="Team">
            <Tab value="members">Members</Tab>
            <Tab value="invites">
              Pending{" "}
              {invites.length > 0 && (
                <Badge tone="primary" content={invites.length} />
              )}
            </Tab>
          </TabList>

          <TabPanel value="members">
            <Grid minColumnWidth="16rem" gap={4}>
              {members.map((member) => {
                const [firstName, lastName] = member.name.split(" ");
                return (
                  <Card key={member.email}>
                    <CardHeader>
                      <Stack orientation="horizontal" align="center" gap={3}>
                        <Avatar firstName={firstName} lastName={lastName} />
                        <div>
                          <strong>{member.name}</strong>
                          <p style={muted}>{member.email}</p>
                        </div>
                      </Stack>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        tone={roleTone[member.role as keyof typeof roleTone]}
                        content={member.role}
                      />
                    </CardContent>
                    <CardFooter>
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        }
                        items={[
                          {
                            label: "Change role",
                            items: roles.map((r) => ({
                              label: r.label,
                              disabled: r.value === member.role,
                              onSelect: () => setRole(member, r.value),
                            })),
                          },
                          { separator: true },
                          {
                            label: "Remove from team",
                            tone: "danger",
                            onSelect: () => remove(member),
                          },
                        ]}
                      />
                    </CardFooter>
                  </Card>
                );
              })}
            </Grid>
          </TabPanel>

          <TabPanel value="invites">
            {invites.length === 0 ? (
              <Alert title="No pending invites">
                People you invite show up here until they join.
              </Alert>
            ) : (
              <Stack gap={3}>
                {invites.map((email) => (
                  <Card key={email}>
                    <CardContent>
                      <Stack
                        orientation="horizontal"
                        justify="between"
                        align="center"
                        gap={3}
                      >
                        <span>{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setInvites((list) =>
                              list.filter((e) => e !== email),
                            )
                          }
                        >
                          Revoke
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </Tabs>
      </Stack>

      <Dialog
        open={inviting}
        onOpenChange={setInviting}
        title="Invite a teammate"
        description="They get an email with a link to join."
        footer={
          <>
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="invite-form">
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={sendInvite}>
          <Stack gap={4}>
            <Input name="email" label="Work email" type="email" required />
            <Select
              name="role"
              label="Role"
              options={roles}
              defaultValue="Editor"
            />
          </Stack>
        </form>
      </Dialog>
    </Container>
  );
}
