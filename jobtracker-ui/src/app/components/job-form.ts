import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobFormModel, STATUSES } from '../models';

/** The add / edit form, shared by the Add Job page and the job details page. */
@Component({
  selector: 'app-job-form',
  imports: [FormsModule],
  template: `
    <form class="form-grid" (ngSubmit)="submitted.emit()">
      <div class="form-section">The job</div>
      <label class="field w2">Company *
        <input name="company" [(ngModel)]="model().company" placeholder="e.g. Emirates NBD" required />
      </label>
      <label class="field w2">Role *
        <input name="role" [(ngModel)]="model().role" placeholder="e.g. Full Stack Developer" required />
      </label>
      <label class="field">Status
        <select name="status" [(ngModel)]="model().status">
          @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
        </select>
      </label>
      <label class="field">Date applied
        <input type="date" name="dateApplied" [(ngModel)]="model().dateApplied" />
      </label>
      <label class="field">Follow-up date
        <input type="date" name="followUpDate" [(ngModel)]="model().followUpDate" />
      </label>
      <label class="field">Source
        <input name="source" [(ngModel)]="model().source" list="sources" placeholder="LinkedIn, Bayt…" />
        <datalist id="sources">
          <option value="LinkedIn"></option><option value="Indeed"></option><option value="Bayt"></option>
          <option value="Naukrigulf"></option><option value="Company website"></option><option value="Referral"></option>
        </datalist>
      </label>
      <label class="field">Location
        <input name="location" [(ngModel)]="model().location" placeholder="Dubai, hybrid" />
      </label>
      <label class="field">Salary
        <input name="salary" [(ngModel)]="model().salary" placeholder="AED 18,000 / month" />
      </label>
      <label class="field w2">Job link
        <input name="jobUrl" [(ngModel)]="model().jobUrl" placeholder="https://…" />
      </label>

      <div class="form-section">Recruiter / hiring contact</div>
      <label class="field">Name
        <input name="recruiterName" [(ngModel)]="model().recruiterName" placeholder="e.g. Sara Ahmed" />
      </label>
      <label class="field">Email
        <input type="email" name="recruiterEmail" [(ngModel)]="model().recruiterEmail" placeholder="sara@company.com" />
      </label>
      <label class="field">Phone
        <input type="tel" name="recruiterPhone" [(ngModel)]="model().recruiterPhone" placeholder="+971 50 …" />
      </label>
      <label class="field">LinkedIn
        <input name="recruiterLinkedIn" [(ngModel)]="model().recruiterLinkedIn" placeholder="linkedin.com/in/…" />
      </label>

      <div class="form-section">Description &amp; notes</div>
      <label class="field full">Job description
        <textarea name="jobDescription" rows="7" [(ngModel)]="model().jobDescription"
                  placeholder="Paste the full advert. The AI uses it for the match score, CV tailoring, cover letter and interview prep."></textarea>
      </label>
      <label class="field full">Notes
        <textarea name="notes" rows="2" [(ngModel)]="model().notes" placeholder="Anything to remember"></textarea>
      </label>

      <div class="form-actions">
        <button class="btn primary" type="submit" [disabled]="busy()">
          @if (busy()) { <span class="spinner"></span> Saving… } @else { {{ submitLabel() }} }
        </button>
        <ng-content />
      </div>
    </form>
  `
})
export class JobForm {
  model = input.required<JobFormModel>();
  submitLabel = input('Save');
  busy = input(false);
  submitted = output<void>();
  statuses = STATUSES;
}
