import {Component, Input, OnInit, OnDestroy} from "@angular/core";
import {Store} from "@ngrx/store";
import {IState} from "../../../app.store";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UniversalValidators } from "ngx-validators";
import * as Immutable from "immutable";
import {Observable, Subscription} from "rxjs";
import * as moment from "moment";
import * as actions from "../backlog.actions";

@Component({
    selector: "tg-sprint-add-edit-lightbox",
    template: require("./sprint-add-edit-lightbox.pug")(),
})
export class SprintAddEditLightbox implements OnInit, OnDestroy {
    @Input() project: Immutable.Map<string,any>;
    @Input() editingSprint: Immutable.Map<string, any>;
    lastSprint: Immutable.Map<string, any>;
    subscriptions: Subscription[];
    createEditSprintForm: FormGroup;

    constructor(private store: Store<IState>, private fb: FormBuilder) {
        this.createEditSprintForm = this.fb.group({
            name: ["", Validators.compose([
                Validators.required,
                UniversalValidators.maxLength(500),
            ])],
            startDate: ["", Validators.required],
            endDate: ["", Validators.required],
        });
    }

    ngOnInit() {
        this.subscriptions = [
            this.store.select((state) => state.getIn(["backlog", "sprints", "sprints", 0]))
                      .subscribe((lastSprint) => {
                if (!this.editingSprint && lastSprint) {
                    this.lastSprint = lastSprint;
                    let estimatedStart = moment(lastSprint.get('estimated_finish')).add(1, "days");
                    let estimatedEnd = moment(lastSprint.get('estimated_finish')).add(15, "days");
                    this.createEditSprintForm.controls.startDate.setValue(estimatedStart);
                    this.createEditSprintForm.controls.endDate.setValue(estimatedEnd);
                }
            }),
            this.store.select((state) => state.getIn(["backlog", "editing-sprint"])).subscribe((editingSprint) => {
                this.editingSprint = editingSprint;
                if (this.editingSprint) {
                    this.createEditSprintForm.controls.startDate.setValue(editingSprint.get('estimated_start'));
                    this.createEditSprintForm.controls.endDate.setValue(editingSprint.get('estimated_finish'));
                }
            })
        ]
    }

    ngOnDestroy() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    onSubmit() {
        if (this.createEditSprintForm.valid) {
            let data = this.createEditSprintForm.value;
            if (this.editingSprint) {
                this.store.dispatch(new actions.UpdateSprintAction(
                    this.editingSprint.get('id'),
                    data.name,
                    data.startDate.format("YYYY-MM-DD"),
                    data.endDate.format("YYYY-MM-DD"),
                ))
            } else {
                this.store.dispatch(new actions.CreateSprintAction(
                    this.project.get('id'),
                    data.name,
                    data.startDate.format("YYYY-MM-DD"),
                    data.endDate.format("YYYY-MM-DD"),
                ))
            }
        } else {
            this.createEditSprintForm.controls.name.markAsDirty();
        }
        return false;
    }
}
