export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CommuniVerse. All rights reserved.
      </div>
    </footer>
  );
}
